'use strict';

/*
 * GET /api/visit  ->  { "count": <number|null> }
 *
 * - Unique browsers only: a new browser increments the counter once and gets two cookies,
 *   visitor_id (random UUID) and visitor_no (its number). A returning browser gets its own
 *   number back with no increment.
 * - Bots/crawlers (and requests with no User-Agent) never increment and get no cookies;
 *   they receive the current total.
 * - Any failure -> 200 { "count": null }. Never throws.
 * - Stores only the counter and a random cookie id. No IPs, no user agents, nothing logged.
 */

const crypto = require('crypto');

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 365 days
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|pingdom|uptime/i;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

// cookieSecure: 'auto' | 'true' | 'false'. In auto mode the Secure flag is set only when the
// request arrived over HTTPS (directly, or via a proxy sending X-Forwarded-Proto: https).
function isSecureRequest(req, cookieSecure) {
  if (cookieSecure === 'true') return true;
  if (cookieSecure === 'false') return false;
  const forwarded = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return Boolean(req.socket && req.socket.encrypted) || forwarded === 'https';
}

function createVisitHandler({ store, cookieSecure }) {
  return async function handleVisit(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return json(res, 405, { error: 'Method Not Allowed' });
    }

    try {
      const userAgent = req.headers['user-agent'] || '';

      // Bots: report the total, change nothing.
      if (!userAgent || BOT_PATTERN.test(userAgent)) {
        return json(res, 200, { count: await store.get() });
      }

      // Returning browser: valid cookies and a number that has really been issued.
      const cookies = parseCookies(req.headers.cookie);
      const assigned = /^[1-9][0-9]{0,15}$/.test(cookies.visitor_no || '') ? Number(cookies.visitor_no) : 0;
      if (ID_PATTERN.test(cookies.visitor_id || '') && assigned > 0 && assigned <= (await store.get())) {
        return json(res, 200, { count: assigned });
      }

      // New browser: count it once and remember it.
      const count = await store.increment();
      const flags = '; Max-Age=' + COOKIE_MAX_AGE + '; Path=/; SameSite=Lax; HttpOnly' +
        (isSecureRequest(req, cookieSecure) ? '; Secure' : '');
      res.setHeader('Set-Cookie', [
        'visitor_id=' + crypto.randomUUID() + flags,
        'visitor_no=' + count + flags
      ]);
      return json(res, 200, { count });
    } catch (err) {
      if (!err.logged) console.error('Visit handler error:', err.message);
      return json(res, 200, { count: null });
    }
  };
}

module.exports = { createVisitHandler };
