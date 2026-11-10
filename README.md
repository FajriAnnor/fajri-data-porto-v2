# Fajri — Portfolio

Personal portfolio for Fajri, Data Analyst. Plain HTML + CSS + vanilla JS, no build step.
A small Node server with **zero npm dependencies** serves the site, the unique-visitor counter (`GET /api/visit`) and the contact form backend (`POST /api/contact`).

```
public/             the website (document root)
  index.html          page (all copy is real HTML, readable without JS)
  css/style.css       styles
  js/content.js       link URLs, stat-tile numbers, experience dates
  js/main.js          loader, nav, reveal-on-scroll, visitor fetch
  assets/             favicon.svg, portrait.svg (placeholder)
  resume/Fajri_Resume.pdf   resume PDF (the "Download resume" link points here)
server.js           static file server + routing, config, graceful shutdown
lib/visit.js        GET /api/visit logic (cookies, bots, unique counting)
lib/store.js        counter storage (JSON file); swap this to use Redis/SQLite later
lib/contact.js      POST /api/contact (contact form backend, messages.jsonl, anti-spam)
lib/env.js          tiny .env loader shared by server.js and the scripts
scripts/read-messages.js   prints the stored contact messages (npm run messages)
data/               runtime data (visitors.json, messages.jsonl are git-ignored; .gitkeep keeps the folder)
```

Server code lives outside `public/`, so it can never be served as a static file.

## Run locally

Requires Node.js 20 or newer.

```bash
node server.js        # or: npm start
```

Open <http://localhost:3000>.

## Configuration

Environment variables, optionally set in a `.env` file in this folder (see `.env.example`; real environment variables always win over `.env`):

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Port to listen on |
| `HOST` | `127.0.0.1` | Interface to bind. Keep it on localhost when behind Nginx |
| `DATA_DIR` | `./data` | Where `visitors.json` lives (relative paths resolve from this folder) |
| `COOKIE_SECURE` | `auto` | `auto`: Secure cookies only when the request is HTTPS or `X-Forwarded-Proto: https`. `true` / `false` force it |
| `TRUST_PROXY` | `false` | `true`: use the first `X-Forwarded-For` value as the client IP for the contact form rate limit. Set it to `true` **only** behind your own reverse proxy that overwrites that header (see the Nginx example). Otherwise anyone could spoof it |
| `ALLOWED_ORIGINS` | empty | Optional comma-separated extra origins allowed to POST `/api/contact`, e.g. `https://example.com`. Posts from the site's own host are always allowed |

The server logs one line on start and errors only. It never logs IPs, cookies or user agents.

## Visitor counter

- Data file: `DATA_DIR/visitors.json`, content `{"count": N}`. A missing file counts as 0; the data folder is created if missing.
- A new browser increments the counter once and receives cookies `visitor_id` (random UUID) and `visitor_no` (its number), both HttpOnly, `Path=/`, `SameSite=Lax`, 365 days. A returning browser gets its own number back with no increment. Reloads never increment.
- Bots (User-Agent contains bot, crawl, spider, slurp, preview, headless, lighthouse, etc., or no User-Agent) never increment and get no cookies; they receive the current total.
- Non-GET requests to `/api/visit` return `405`. Responses are `Cache-Control: no-store`.
- Any error responds `200 {"count": null}`, and the loader then shows its line without a number. The front-end never aborts the request: the loader stops waiting after 800 ms while the request finishes in the background.
- Increments go through an in-process queue and writes are atomic (temp file, fsync, rename), so concurrent requests cannot lose or duplicate a number.
- If `visitors.json` is corrupt it is **not** reset: it is copied to `visitors.json.corrupt-<timestamp>`, an error is logged, and the API returns `{"count": null}` until you fix the file.
- Cookies whose number is higher than the current count are ignored (treated as a new visitor).

### Reset the counter

Stop the server, then edit `data/visitors.json` (e.g. `{"count": 0}`) or delete it, and start the server again. Browsers that already hold a `visitor_no` cookie at or below the new count keep their old number; that is expected after a manual reset.

### Quick check

```bash
curl -i -c jar.txt -A "Mozilla/5.0" http://localhost:3000/api/visit   # new visitor
curl -i -b jar.txt -A "Mozilla/5.0" http://localhost:3000/api/visit   # returning: same number
curl -i -A "Googlebot" http://localhost:3000/api/visit                # bot: total, no cookies
```

## Contact form

The Contact section has a form (name, email, message) backed by `POST /api/contact` (`lib/contact.js`).

**There is NO email or chat notification yet.** Messages are only written to a file. Read them with `npm run messages` (or open the file). `notify(message)` in `lib/contact.js` is an empty hook where a notification can be added later; errors inside it can never fail a request.

How it works:

- **With JavaScript** the form is sent as JSON with `fetch`, and the page shows the result in place (idle, sending, success, error). Success is shown only when the server answers 2xx with `{"ok":true}`.
- **Without JavaScript** the plain `<form method="post" action="/api/contact">` works. The server redirects back to `/#sent` (success) or `/#send-error` (failure) and CSS `:target` shows the matching note. Send `Accept: application/json` to get JSON instead of redirects (handy for `curl`).
- **Accepts** `application/json` and `application/x-www-form-urlencoded`, body up to 10 KB (larger: `413`). Other content types: `415`. Only `POST` (`405` otherwise). Responses are `Cache-Control: no-store`.
- **Validation** (client and server): name 1–100 characters, email valid format up to 200, message 10–2000 characters. The server trims, strips control characters and answers `400 {"ok":false,"errors":{...}}`.
- **Anti-spam:**
  - hidden honeypot field `website`: if filled, the server answers success but stores nothing;
  - field `t` = milliseconds since page load (set by the JS): below 3000 the server answers success but stores nothing. Missing `t` (no-JS form) is accepted;
  - at most 3 stored messages per hour per client (`429` beyond that). Clients are identified by a salted hash of the IP that exists only in memory (new salt on every start); raw IPs are never stored, logged or written to disk;
  - an `Origin` header, when present, must match the request `Host` (or `ALLOWED_ORIGINS`), else `403`.
- **Client IP:** the socket address by default. With `TRUST_PROXY=true` the first `X-Forwarded-For` value is used instead.
- **Storage:** one JSON line per message appended to `DATA_DIR/messages.jsonl` as `{"id","receivedAt","name","email","message"}`. Appends go through an in-process queue (never interleave or get lost) and are fsynced. The file is created with mode 0600 on Linux and is git-ignored. If a write fails the API answers `500 {"ok":false}` and the page shows the error state.
- **Logging:** only a generic error line when something fails. Message contents and emails are never logged.

### Read the messages

```bash
npm run messages
```

Prints every stored message (oldest first, newest last) with date, sender and text. It reads `DATA_DIR` from the environment or `.env`, so run it on the machine (or VPS) where the server stores its data. The file contains personal data (names, emails, messages): keep it private and include it in your backups.

## Static files

- `GET` and `HEAD` only (`405` otherwise). `/` serves `index.html`.
- Dotfiles are never served and path traversal is rejected. Only files inside `public/` can be served.
- File names are matched with **exact case**, so `/resume/fajri_resume.pdf` is a 404 on Windows too, exactly like on Linux.
- If `public/assets/portrait.jpg` does not exist, `/assets/portrait.jpg` serves `portrait.svg` instead.
- Cache: `no-cache` for HTML, `public, max-age=3600` for everything else. Security headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.

## Editing content

- Copy lives in `public/index.html`. Links, stat-tile numbers and experience dates are also in `public/js/content.js`; `main.js` applies them on top of the HTML defaults, so **keep both in sync**.
- Experience dates: fill `dates.wedison` / `dates.berkah` in `public/js/content.js`. Empty values are not rendered.
- Photo: drop `public/assets/portrait.jpg` (keep it under ~200 KB). It is shown in grayscale automatically; the SVG is the fallback. Update the `alt` text on the portrait `<img>` when you do.
- Resume: the PDF lives at `public/resume/Fajri_Resume.pdf` (exact case).

## Run on a VPS later (UNTESTED)

> These steps have **not** been tested; they could not be run in the development environment. Treat them as a starting point and test on your own server. Replace `example.com` and the paths.

Assumptions: Ubuntu/Debian, Node.js 20+ installed, project copied to `/opt/portfolio`, a `portfolio` system user.

### systemd unit — `/etc/systemd/system/portfolio.service`

```ini
[Unit]
Description=Fajri portfolio
After=network.target

[Service]
Type=simple
User=portfolio
WorkingDirectory=/opt/portfolio
ExecStart=/usr/bin/node server.js
Environment=PORT=3000
Environment=HOST=127.0.0.1
Environment=DATA_DIR=/opt/portfolio/data
Environment=COOKIE_SECURE=auto
# Nginx below overwrites X-Forwarded-For, so it is safe to trust it for the contact rate limit
Environment=TRUST_PROXY=true
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/opt/portfolio/data

[Install]
WantedBy=multi-user.target
```

```bash
sudo useradd --system --home /opt/portfolio --shell /usr/sbin/nologin portfolio
sudo chown -R portfolio:portfolio /opt/portfolio/data
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio
```

### Nginx — `/etc/nginx/sites-available/portfolio`

Nginx serves `public/` directly and proxies only `/api/` to Node. Because Nginx serves the static files, the portrait fallback is repeated here.

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /opt/portfolio/public;
    index index.html;

    # Never serve dotfiles
    location ~ /\. { deny all; }

    # Missing portrait.jpg falls back to the SVG placeholder
    location = /assets/portrait.jpg {
        try_files /assets/portrait.jpg /assets/portrait.svg;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header X-Forwarded-Proto $scheme;
        # overwrite (not append) so a client cannot spoof its address; the server trusts this with TRUST_PROXY=true
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ =404;
    }

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header X-Frame-Options DENY always;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com   # enables HTTPS
```

Without `TRUST_PROXY=true` every visitor reaches Node as `127.0.0.1`, so the contact form's 3-per-hour limit would be shared by everybody. With it set, Nginx must overwrite `X-Forwarded-For` as shown (and `Host` must be forwarded for the Origin check).

Once HTTPS is on, `COOKIE_SECURE=auto` sets the Secure flag because Nginx sends `X-Forwarded-Proto: https`.
