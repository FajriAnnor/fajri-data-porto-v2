# Fajri — Portfolio

Personal portfolio for Fajri, Data Analyst. Plain HTML + CSS + vanilla JS, no build step.
One Vercel serverless function (`api/visit.js`) powers the unique-visitor counter, stored in Upstash Redis.

```
index.html          page (all copy is real HTML, readable without JS)
css/style.css       styles
js/content.js       link URLs, stat-tile numbers, experience dates
js/main.js          loader, nav, reveal-on-scroll, visitor fetch
api/visit.js        GET /api/visit -> { "count": <number|null> }
assets/             favicon.svg, portrait.svg (placeholder)
resume/Fajri_Resume.pdf   resume PDF (the "Download resume" link points here)
```

## Run locally

Requires Node.js 18+ and the Vercel CLI.

```bash
npm i -g vercel        # once
vercel login           # once
vercel dev             # serves the site and /api/visit at http://localhost:3000
```

`vercel dev` reads `.env.local` automatically. The page also works without the API: the loader
simply shows "A little hello. Glad you stopped by." with no number.

## Visitor counter setup (Upstash Redis)

1. Create a free account at <https://upstash.com> and create a **Redis** database.
2. Open the database, go to the **REST API** section and copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. Locally: paste them into `.env.local` (see `.env.example`). This file is gitignored — never commit it.
4. On Vercel: Project → Settings → Environment Variables, add both names for Production (and Preview if wanted), then redeploy.

How it behaves:

- Redis key: `portfolio:visitors`.
- First visit from a browser: `INCR`, then cookies `visitor_id` (random UUID) and `visitor_no` (assigned number); both 1 year, `Path=/`, `SameSite=Lax`, `Secure`, `HttpOnly`.
- Returning browser (cookies present): returns its own number, no increment. Refresh never increments.
- Bots (User-Agent contains bot, crawl, spider, slurp, preview, headless, lighthouse, etc., or no User-Agent): no increment, no cookies; returns the current total.
- Non-GET → `405`. Responses are `Cache-Control: no-store`.
- The front-end never aborts the request: the loader just stops waiting after 800 ms and shows the line without a number, while the request finishes in the background (so the visit is counted once and the cookies are saved).
- Missing env vars or any Redis error → `200 { "count": null }`. It never throws.
- No IPs or personal data are stored or logged — only the counter and the random cookie id.

Quick check once the server is running (use a browser-like User-Agent; a cookie jar simulates a returning visitor):

```bash
curl -i -c jar.txt -A "Mozilla/5.0" http://localhost:3000/api/visit   # new visitor
curl -i -b jar.txt -A "Mozilla/5.0" http://localhost:3000/api/visit   # returning: same number
curl -i -A "Googlebot" http://localhost:3000/api/visit                # bot: total, no cookies
```

(`Secure` cookies are accepted by browsers on `localhost`; `curl` stores and resends them via the jar.)

## Deploy (Vercel)

1. Push the project to a Git repository and import it in Vercel (Framework preset: **Other**, no build command, no output directory).
2. Add the two Upstash env vars (above) and deploy. `api/visit.js` is picked up automatically.
3. Or from the CLI: `vercel` (preview) / `vercel --prod`.

`.vercelignore` keeps `CLAUDE.md`, `README.md` and env/dotfiles out of the deployment. It must not list `resume/`, `api/`, `assets/`, `css/` or `js/`.

## Editing content

- Copy lives in `index.html`. Links, stat-tile numbers and experience dates are also in `js/content.js`; `main.js` applies them on top of the HTML defaults, so **keep both in sync**.
- Experience dates: fill `dates.wedison` / `dates.berkah` in `js/content.js`. Empty values are not rendered.
- Photo: drop `assets/portrait.jpg` (keep it under ~200 KB). It is shown in grayscale automatically; the SVG is the fallback. Update the `alt` text on the portrait `<img>` in `index.html` when you do.
- Resume: the PDF lives at `resume/Fajri_Resume.pdf` (exact case; Vercel is case-sensitive).
