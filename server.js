'use strict';

/*
 * Self-hosted server: static files from ./public plus GET /api/visit.
 * Node built-ins only. Configuration (environment variables, optionally from ./.env):
 *   PORT          default 3000
 *   HOST          default 127.0.0.1
 *   DATA_DIR      default ./data (relative paths are resolved from this folder)
 *   COOKIE_SECURE auto (default) | true | false
 * Logs one line on start and errors only. Never logs IPs, cookies or user agents.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { FileStore } = require('./lib/store');
const { createVisitHandler } = require('./lib/visit');

/* ---------- Config ---------- */

// Tiny .env parser: KEY=VALUE lines, # comments, optional quotes. Never overrides
// variables that are already set in the environment.
function loadEnvFile(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (err) { return; }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = line.slice(eq + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.length >= 2 && value.endsWith(quote)) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, '.env'));

function fail(message) {
  console.error('Config error: ' + message);
  process.exit(1);
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) fail('PORT must be an integer between 0 and 65535');
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = path.resolve(__dirname, process.env.DATA_DIR || './data');
const COOKIE_SECURE = (process.env.COOKIE_SECURE || 'auto').toLowerCase();
if (!['auto', 'true', 'false'].includes(COOKIE_SECURE)) fail('COOKIE_SECURE must be auto, true or false');

const PUBLIC_DIR = path.join(__dirname, 'public');

/* ---------- Static files ---------- */

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
}

function sendText(res, status, message, extraHeaders) {
  res.writeHead(status, Object.assign({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  }, extraHeaders));
  res.end(message + '\n');
}

// URL path -> list of safe path segments, or null if the path must not be served.
// Rejects bad encodings, NUL bytes, backslashes, ':' (Windows streams) and any segment
// starting with '.' (this covers '..', '.env' and every other dotfile).
function toSegments(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch (err) { return null; }
  if (/[\0\\]/.test(decoded)) return null;
  const segments = decoded.split('/').filter(Boolean);
  if (segments.some((s) => s.startsWith('.') || s.includes(':'))) return null;
  return segments.length ? segments : ['index.html'];
}

function realpathNative(p) {
  return new Promise((resolve) => fs.realpath.native(p, (err, real) => resolve(err ? null : real)));
}

// Resolves segments to a real file inside /public, or null.
// The real path must equal the requested path character for character. That rejects
// symlinks leaving /public and also wrong-case names, so Windows (case-insensitive)
// behaves like Linux: /resume/fajri_resume.pdf is a 404 on both.
async function resolveFile(segments, realPublicDir) {
  const candidate = path.join(realPublicDir, ...segments);
  const real = await realpathNative(candidate);
  if (real !== candidate) return null;
  try {
    const stat = await fs.promises.stat(real);
    return stat.isFile() ? { file: real, size: stat.size } : null;
  } catch (err) {
    return null;
  }
}

function createStaticHandler(realPublicDir) {
  return async function serveStatic(req, res, urlPath) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendText(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    }

    const segments = toSegments(urlPath);
    if (!segments) return sendText(res, 404, 'Not Found');

    let found = await resolveFile(segments, realPublicDir);
    let isFallback = false;
    // No portrait.jpg yet: show the SVG placeholder instead.
    if (!found && segments.join('/') === 'assets/portrait.jpg') {
      found = await resolveFile(['assets', 'portrait.svg'], realPublicDir);
      isFallback = Boolean(found);
    }
    if (!found) return sendText(res, 404, 'Not Found');

    const ext = path.extname(found.file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': found.size,
      // HTML (and the fallback image, which changes once a real photo is added) is always
      // revalidated; other assets may be cached for an hour.
      'Cache-Control': ext === '.html' || isFallback ? 'no-cache' : 'public, max-age=3600'
    });
    if (req.method === 'HEAD') return res.end();

    pipeline(fs.createReadStream(found.file), res, (err) => {
      if (err && !res.writableEnded) res.destroy();
    });
  };
}

/* ---------- Start ---------- */

async function main() {
  const realPublicDir = await realpathNative(PUBLIC_DIR);
  if (!realPublicDir) fail('public/ folder not found');

  const store = new FileStore(DATA_DIR);
  try {
    await store.init(); // creates DATA_DIR if missing
  } catch (err) {
    console.error('Cannot create data directory (' + err.code + '). The counter will return null.');
  }

  const handleVisit = createVisitHandler({ store, cookieSecure: COOKIE_SECURE });
  const serveStatic = createStaticHandler(realPublicDir);

  const server = http.createServer(async (req, res) => {
    try {
      setSecurityHeaders(res);
      const urlPath = String(req.url || '').split('#')[0].split('?')[0];
      if (!urlPath.startsWith('/')) return sendText(res, 400, 'Bad Request');

      if (urlPath === '/api/visit') return await handleVisit(req, res);
      if (urlPath.startsWith('/api/')) return sendText(res, 404, 'Not Found');
      return await serveStatic(req, res, urlPath);
    } catch (err) {
      console.error('Unhandled request error:', err.message);
      if (!res.headersSent) sendText(res, 500, 'Internal Server Error');
      else res.destroy();
    }
  });

  server.on('error', (err) => {
    console.error('Server error: ' + (err.code || err.message));
    process.exit(1);
  });
  server.on('clientError', (err, socket) => {
    if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
  });

  server.listen(PORT, HOST, () => {
    console.log('Listening on http://' + HOST + ':' + server.address().port + ' (data: ' + DATA_DIR + ')');
  });

  // Graceful shutdown: stop accepting, let in-flight requests and counter writes finish.
  let closing = false;
  function shutdown() {
    if (closing) return;
    closing = true;
    const force = setTimeout(() => process.exit(1), 5000);
    force.unref();
    server.close(() => {
      store.flush().catch(() => {}).then(() => process.exit(0));
    });
    server.closeIdleConnections();
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
