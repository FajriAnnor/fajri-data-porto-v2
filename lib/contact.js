'use strict';

/*
 * POST /api/contact
 *
 * Accepts JSON or application/x-www-form-urlencoded (max 10 KB). Validates again on the server,
 * appends one JSON line per message to DATA_DIR/messages.jsonl and answers { ok: true }.
 *
 * Anti-spam: honeypot field "website", minimum time before submit (field "t"), 3 messages per
 * hour per client, same-origin check. Clients are identified by a salted hash of the IP that
 * lives only in memory; raw IPs are never stored, logged or written to disk.
 * Message contents and emails are never logged.
 *
 * Browsers without JS post the plain form (form-encoded) and get a redirect back to the page
 * (/#sent or /#send-error). Send "Accept: application/json" to always get JSON.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MAX_BODY_BYTES = 10 * 1024;
const BODY_TIMEOUT_MS = 10 * 1000;
const MIN_FILL_MS = 3000;           // faster than this = a bot (answered 200, stored nowhere)
const RATE_LIMIT = 3;               // messages ...
const RATE_WINDOW_MS = 60 * 60 * 1000; // ... per hour per client
const RATE_MAX_CLIENTS = 10000;     // memory cap

const LIMITS = { nameMax: 100, emailMax: 200, messageMin: 10, messageMax: 2000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERROR_TEXT = {
  name: 'Please enter your name (up to 100 characters).',
  email: 'Please enter a valid email address.',
  message: 'Your message should be between 10 and 2000 characters.'
};

/* ---------- Storage: append-only JSON lines behind an in-process queue ---------- */

class MessageStore {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'messages.jsonl');
    this._queue = Promise.resolve();
  }

  // Appends one line. Calls run one after another, so lines never interleave or get lost.
  append(record) {
    const line = JSON.stringify(record) + '\n';
    const result = this._queue.then(async () => {
      await fs.promises.mkdir(this.dir, { recursive: true });
      const handle = await fs.promises.open(this.file, 'a', 0o600);
      try {
        await handle.appendFile(line);
        await handle.sync();
      } finally {
        await handle.close();
      }
    });
    this._queue = result.catch(() => {});
    return result;
  }

  flush() {
    return this._queue;
  }
}

/* ---------- Rate limit: in memory, salted hash of the client IP ---------- */

class RateLimiter {
  constructor() {
    this.salt = crypto.randomBytes(16);   // new on every start, never persisted
    this.hits = new Map();                // hash -> [timestamps]
    const sweep = setInterval(() => this._sweep(), 10 * 60 * 1000);
    sweep.unref();
  }

  key(ip) {
    return crypto.createHash('sha256').update(this.salt).update(String(ip)).digest('hex').slice(0, 24);
  }

  _recent(key, now) {
    const list = (this.hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
    if (list.length) this.hits.set(key, list); else this.hits.delete(key);
    return list;
  }

  // Checks and reserves a slot in one synchronous step, so parallel requests cannot all pass.
  take(ip) {
    const now = Date.now();
    const key = this.key(ip);
    const list = this._recent(key, now);
    if (list.length >= RATE_LIMIT) return null;
    if (!this.hits.has(key) && this.hits.size >= RATE_MAX_CLIENTS) {
      this.hits.delete(this.hits.keys().next().value); // drop the oldest client
    }
    list.push(now);
    this.hits.set(key, list);
    return { key, stamp: now };
  }

  // Gives the slot back when the message could not be stored.
  release(slot) {
    const list = this.hits.get(slot.key);
    if (!list) return;
    const i = list.indexOf(slot.stamp);
    if (i !== -1) list.splice(i, 1);
    if (!list.length) this.hits.delete(slot.key);
  }

  _sweep() {
    const now = Date.now();
    for (const key of Array.from(this.hits.keys())) this._recent(key, now);
  }
}

/* ---------- Helpers ---------- */

// Removes control characters. With keepBreaks, tabs and line breaks survive.
function stripControl(value, keepBreaks) {
  const re = keepBreaks
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;
  return String(value).replace(re, '');
}

function validate(fields) {
  const errors = {};
  const name = stripControl(fields.name, false).trim();
  const email = stripControl(fields.email, false).trim();
  const message = stripControl(String(fields.message).replace(/\r\n?/g, '\n'), true).trim();

  if (!name || name.length > LIMITS.nameMax) errors.name = ERROR_TEXT.name;
  if (!EMAIL_RE.test(email) || email.length > LIMITS.emailMax) errors.email = ERROR_TEXT.email;
  if (message.length < LIMITS.messageMin || message.length > LIMITS.messageMax) errors.message = ERROR_TEXT.message;

  return { errors, clean: { name, email, message } };
}

function clientIp(req, trustProxy) {
  if (trustProxy) {
    const first = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (first) return first;
  }
  return req.socket.remoteAddress || 'unknown';
}

// An Origin header, when present, must match this site (Host) or ALLOWED_ORIGINS.
function originAllowed(req, allowedOrigins) {
  const origin = req.headers.origin;
  if (origin === undefined) return true;
  const normalized = String(origin).trim().toLowerCase();
  if (allowedOrigins.includes(normalized)) return true;
  try {
    return new URL(normalized).host === String(req.headers.host || '').toLowerCase();
  } catch (err) {
    return false;
  }
}

function sendJson(res, status, body, extraHeaders) {
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  }, extraHeaders));
  res.end(JSON.stringify(body));
}

// Reads the body up to the size limit. Resolves { tooLarge: true } or { text }.
function readBody(req) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return resolve({ tooLarge: true });

    const chunks = [];
    let size = 0;
    const timer = setTimeout(() => { cleanup(); reject(Object.assign(new Error('body timeout'), { code: 'ETIMEDOUT' })); }, BODY_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timer);
      req.off('data', onData);
      req.off('end', onEnd);
      req.off('error', onError);
    }
    function onData(chunk) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) { cleanup(); resolve({ tooLarge: true }); return; }
      chunks.push(chunk);
    }
    function onEnd() { cleanup(); resolve({ text: Buffer.concat(chunks).toString('utf8') }); }
    function onError(err) { cleanup(); reject(err); }

    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onError);
  });
}

// Hook for a future email/chat notification. Intentionally empty. Errors inside must never
// fail the request (the caller catches them).
async function notify(message) { // eslint-disable-line no-unused-vars
}

/* ---------- Handler ---------- */

function createContactHandler({ dataDir, trustProxy, allowedOrigins, hooks }) {
  const store = new MessageStore(dataDir);
  const limiter = new RateLimiter();
  const notifyHook = (hooks && hooks.notify) || notify;
  const origins = (allowedOrigins || []).map((o) => o.trim().toLowerCase()).filter(Boolean);

  async function handle(req, res) {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, error: 'Method Not Allowed' }, { Allow: 'POST' });
    }
    if (!originAllowed(req, origins)) return sendJson(res, 403, { ok: false });

    const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const isJsonBody = contentType === 'application/json';
    const isFormBody = contentType === 'application/x-www-form-urlencoded';
    if (!isJsonBody && !isFormBody) return sendJson(res, 415, { ok: false });

    // Plain form posts (no JS) get redirects; everything else gets JSON.
    const wantsJson = isJsonBody || /application\/json/i.test(String(req.headers.accept || ''));
    const reply = (status, body, redirectTo) => {
      if (wantsJson) return sendJson(res, status, body);
      res.writeHead(303, { Location: redirectTo, 'Cache-Control': 'no-store' });
      return res.end();
    };

    let body;
    try {
      body = await readBody(req);
    } catch (err) {
      res.once('finish', () => req.destroy());
      return sendJson(res, 408, { ok: false }, { Connection: 'close' });
    }
    if (body.tooLarge) {
      res.once('finish', () => req.destroy());
      return sendJson(res, 413, { ok: false }, { Connection: 'close' });
    }

    // Parse into a plain object of strings.
    let input;
    try {
      if (isJsonBody) {
        input = JSON.parse(body.text);
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('not an object');
      } else {
        input = Object.fromEntries(new URLSearchParams(body.text));
      }
    } catch (err) {
      return reply(400, { ok: false, errors: { form: 'Invalid request.' } }, '/#send-error');
    }

    const fields = {
      name: typeof input.name === 'string' ? input.name : '',
      email: typeof input.email === 'string' ? input.email : '',
      message: typeof input.message === 'string' ? input.message : ''
    };
    const honeypot = typeof input.website === 'string' ? input.website.trim() : '';
    const elapsed = input.t === undefined || input.t === '' ? NaN : Number(input.t);

    // Bots: look successful, store nothing.
    if (honeypot) return reply(200, { ok: true }, '/#sent');
    if (Number.isFinite(elapsed) && elapsed < MIN_FILL_MS) return reply(200, { ok: true }, '/#sent');

    const { errors, clean } = validate(fields);
    if (Object.keys(errors).length) return reply(400, { ok: false, errors }, '/#send-error');

    const slot = limiter.take(clientIp(req, trustProxy));
    if (!slot) return reply(429, { ok: false }, '/#send-error');

    const record = {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      name: clean.name,
      email: clean.email,
      message: clean.message
    };
    try {
      await store.append(record);
    } catch (err) {
      limiter.release(slot);
      console.error('Contact: could not store a message (' + (err.code || 'error') + ')');
      return reply(500, { ok: false }, '/#send-error');
    }

    try { await notifyHook(record); } catch (err) { /* notifications must never fail the request */ }
    return reply(200, { ok: true }, '/#sent');
  }

  const handler = async function handleContact(req, res) {
    try {
      return await handle(req, res);
    } catch (err) {
      console.error('Contact handler error:', err.message);
      if (!res.headersSent) sendJson(res, 500, { ok: false });
    }
  };
  handler.flush = () => store.flush();
  return handler;
}

module.exports = { createContactHandler, MessageStore, RateLimiter, validate };
