# Fajri — Portfolio

Personal portfolio for Fajri, Data Analyst. Plain HTML + CSS + vanilla JS, no build step.
A small Node server with **zero npm dependencies** serves the site and the unique-visitor counter (`GET /api/visit`).

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
data/               runtime data (visitors.json is git-ignored; .gitkeep keeps the folder)
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

Once HTTPS is on, `COOKIE_SECURE=auto` sets the Secure flag because Nginx sends `X-Forwarded-Proto: https`.
