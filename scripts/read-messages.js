'use strict';

// Prints the stored contact messages, oldest first (newest last). Usage: npm run messages
// Reads DATA_DIR/messages.jsonl (DATA_DIR comes from the environment or .env, default ./data).

const fs = require('fs');
const path = require('path');
const { loadEnvFile } = require('../lib/env');

const root = path.join(__dirname, '..');
loadEnvFile(path.join(root, '.env'));
const file = path.join(path.resolve(root, process.env.DATA_DIR || './data'), 'messages.jsonl');

let text;
try {
  text = fs.readFileSync(file, 'utf8');
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('No messages yet (' + file + ' does not exist).');
    process.exit(0);
  }
  console.error('Cannot read ' + file + ' (' + err.code + ')');
  process.exit(1);
}

const lines = text.split('\n').filter((l) => l.trim());
if (!lines.length) {
  console.log('No messages yet.');
  process.exit(0);
}

let shown = 0;
lines.forEach((line, i) => {
  let m;
  try { m = JSON.parse(line); } catch (err) {
    console.log('--- line ' + (i + 1) + ': unreadable (skipped)\n');
    return;
  }
  shown++;
  console.log('#' + shown + '  ' + m.receivedAt + '  id ' + m.id);
  console.log('From:  ' + m.name + ' <' + m.email + '>');
  console.log('');
  String(m.message).split('\n').forEach((l) => console.log('  ' + l));
  console.log('\n' + '-'.repeat(60) + '\n');
});
console.log(shown + ' message' + (shown === 1 ? '' : 's') + ' in ' + file);
