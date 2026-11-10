'use strict';

/*
 * Visitor-counter storage. The rest of the app only uses this interface:
 *
 *   store.get()        -> Promise<number>   current total
 *   store.increment()  -> Promise<number>   total after adding one
 *   store.flush()      -> Promise<void>     resolves when queued work is done (shutdown)
 *
 * To move to Redis or SQLite later, write another class with these methods and pass it to
 * createVisitHandler() in server.js. Nothing else has to change.
 *
 * FileStore keeps {"count": N} in DATA_DIR/visitors.json.
 * - Every operation goes through one in-process queue, so concurrent requests can never
 *   lose or duplicate a number.
 * - Writes are atomic: temp file -> fsync -> rename.
 * - A missing file means 0. A corrupt file is NOT reset: it is copied to
 *   visitors.json.corrupt-<timestamp>, an error is logged, and every call fails until the
 *   file is fixed (callers answer {"count": null}).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class FileStore {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'visitors.json');
    this._queue = Promise.resolve();
    this._lastCorruptRaw = null; // avoids a new backup + log line on every request
  }

  async init() {
    await fs.promises.mkdir(this.dir, { recursive: true });
  }

  get() {
    return this._enqueue(() => this._read());
  }

  increment() {
    return this._enqueue(async () => {
      const next = (await this._read()) + 1;
      await this._write(next);
      return next;
    });
  }

  flush() {
    return this._queue;
  }

  // Runs tasks strictly one after another; a failed task does not break the queue.
  _enqueue(task) {
    const result = this._queue.then(task);
    this._queue = result.catch(() => {});
    return result;
  }

  async _read() {
    let raw;
    try {
      raw = await fs.promises.readFile(this.file, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return 0;
      throw this._logged(err, 'Cannot read counter file (' + err.code + ')');
    }

    try {
      const data = JSON.parse(raw);
      if (data && Number.isSafeInteger(data.count) && data.count >= 0) {
        this._lastCorruptRaw = null;
        return data.count;
      }
    } catch (err) { /* falls through to the corrupt handling below */ }

    throw await this._reportCorrupt(raw);
  }

  async _reportCorrupt(raw) {
    if (raw !== this._lastCorruptRaw) {
      this._lastCorruptRaw = raw;
      const stamp = new Date().toISOString().replace(/[-:.]/g, '');
      const backup = this.file + '.corrupt-' + stamp;
      try {
        await fs.promises.copyFile(this.file, backup);
        console.error('visitors.json is corrupt. Backup saved as ' + path.basename(backup) +
          '. The counter is disabled (API returns null) until the file is fixed.');
      } catch (err) {
        console.error('visitors.json is corrupt and the backup failed (' + err.code + '). Counter disabled.');
      }
    }
    const err = new Error('counter file is corrupt');
    err.logged = true;
    return err;
  }

  async _write(count) {
    await fs.promises.mkdir(this.dir, { recursive: true }); // recreates a deleted data dir
    const tmp = this.file + '.' + process.pid + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
    let handle = null;
    try {
      handle = await fs.promises.open(tmp, 'wx');
      await handle.writeFile(JSON.stringify({ count }) + '\n');
      await handle.sync();
      await handle.close();
      handle = null;
      await this._rename(tmp, this.file);
      await this._syncDir();
    } catch (err) {
      if (handle) await handle.close().catch(() => {});
      await fs.promises.unlink(tmp).catch(() => {});
      throw this._logged(err, 'Cannot write counter file (' + err.code + ')');
    }
  }

  // Windows can briefly refuse a rename while antivirus/indexers hold the file.
  async _rename(from, to) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await fs.promises.rename(from, to);
      } catch (err) {
        const transient = err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES';
        if (!transient || attempt >= 5) throw err;
        await sleep(15);
      }
    }
  }

  // Makes the rename durable on POSIX. Not possible on Windows, so failures are ignored.
  async _syncDir() {
    try {
      const dir = await fs.promises.open(this.dir, 'r');
      try { await dir.sync(); } finally { await dir.close(); }
    } catch (err) { /* best effort */ }
  }

  _logged(err, message) {
    console.error(message);
    err.logged = true;
    return err;
  }
}

module.exports = { FileStore };
