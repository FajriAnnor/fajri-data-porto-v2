'use strict';

/*
 * GET /api/visit  ->  { "count": <number|null> }
 *
 * - Unique browsers only: first visit INCRs the Redis counter and sets two cookies
 *   (visitor_id, visitor_no). A returning browser gets its own stored number back, no INCR.
 * - Bots/crawlers (and requests with no User-Agent) never increment and never get cookies;
 *   they receive the current total.
 * - Any failure (missing env vars, Redis down, bad response) -> 200 { "count": null }. Never throws.
 * - Stores only the counter and a random cookie id. No IPs, no personal data, nothing logged.
 */

const crypto = require('crypto');

const COUNTER_KEY = 'portfolio:visitors';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const REDIS_TIMEOUT_MS = 600;              // stay inside the front-end's 800 ms budget

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|pingdom|uptime/i;
const ID_PATTERN = /^[0-9a-f-]{36}$/i;

// One Upstash REST command, e.g. ['INCR', 'key']. Throws on any problem.
async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Upstash env vars missing');

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(REDIS_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error('Upstash HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error('Upstash error');
  return data.result;
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach(function (part) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}

function cookie(name, value) {
  return name + '=' + value + '; Max-Age=' + COOKIE_MAX_AGE + '; Path=/; SameSite=Lax; Secure; HttpOnly';
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const userAgent = req.headers['user-agent'] || '';

    // Bots: report the total, change nothing.
    if (!userAgent || BOT_PATTERN.test(userAgent)) {
      const total = Number(await redis(['GET', COUNTER_KEY]));
      return send(res, 200, { count: Number.isFinite(total) ? total : 0 });
    }

    // Returning browser: give back the number it was assigned.
    const cookies = parseCookies(req.headers.cookie);
    const assigned = Number(cookies.visitor_no);
    if (ID_PATTERN.test(cookies.visitor_id || '') && Number.isSafeInteger(assigned) && assigned > 0) {
      return send(res, 200, { count: assigned });
    }

    // New browser: count it once and remember it.
    const count = Number(await redis(['INCR', COUNTER_KEY]));
    if (!Number.isSafeInteger(count)) throw new Error('Unexpected counter value');
    res.setHeader('Set-Cookie', [
      cookie('visitor_id', crypto.randomUUID()),
      cookie('visitor_no', String(count))
    ]);
    return send(res, 200, { count: count });
  } catch (err) {
    return send(res, 200, { count: null });
  }
};
