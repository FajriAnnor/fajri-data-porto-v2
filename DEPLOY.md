# DEPLOY.md — steps for you to do yourself

This file is excluded from the site by `.vercelignore`.
**Never paste secrets into chat, commits, issues or screenshots.** The Upstash URL and token go only into the Upstash and Vercel dashboards.

## a. Create the Upstash Redis database

1. Sign up / log in at <https://console.upstash.com> (free plan is enough).
2. **Create Database** → type **Redis** → pick a name (e.g. `portfolio`) and the region closest to your Vercel region → Create.
3. Open the database and find the **REST API** section.
4. Copy **`UPSTASH_REDIS_REST_URL`** and **`UPSTASH_REDIS_REST_TOKEN`** (use the normal token, not the read-only one). Keep them in your password manager until step d.

## b. Create an empty GitHub repo and push

1. On GitHub: **New repository** → name it (e.g. `portfolio`) → leave it **empty** (no README, no .gitignore, no license) → Create.
2. In the project folder (the commit "Initial portfolio" already exists on branch `main`):

```bash
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO>.git
git branch -M main
git push -u origin main
```

Before pushing, `git ls-files` should not list `.env`, `.env.local` or `.vercel`.

## c. Import the repo in Vercel

1. <https://vercel.com/new> → **Import** your GitHub repo.
2. Settings on the import screen:
   - **Framework Preset:** Other
   - **Build Command:** leave empty
   - **Output Directory:** leave empty
   - **Install Command:** leave empty
   - **Root Directory:** `./`
3. Do not click Deploy yet if you want the env vars in place for the first build; or deploy now and redeploy after step d (both work).

## d. Add the environment variables, then redeploy

1. Vercel → your project → **Settings → Environment Variables**.
2. Add both, enabling **Production, Preview and Development** for each:
   - `UPSTASH_REDIS_REST_URL` = the REST URL from Upstash
   - `UPSTASH_REDIS_REST_TOKEN` = the REST token from Upstash
3. **Deployments** → open the latest deployment → **⋯ → Redeploy** (env vars only apply to new deployments).

## e. Manual live-test checklist

Open your live URL and check each item:

- [ ] The loader shows "A little hello to visitor #N. Glad you stopped by." with a number.
- [ ] Reload the page, then open the site in a new tab of the same browser: the number stays the same (the loader only shows once per tab session, so use a fresh tab to see it again).
- [ ] An incognito/private window gets a number one higher (+1).
- [ ] **Download resume** opens/downloads the PDF (`/resume/Fajri_Resume.pdf`).
- [ ] All three project buttons open: **Open live dashboard**, **View on GitHub**, **Open live demo**.
- [ ] Portrait slot shows the grey SVG silhouette (until you add `assets/portrait.jpg`), and the browser console (F12) shows no errors.
- [ ] Optional: `https://<your-site>/CLAUDE.md`, `/README.md` and `/DEPLOY.md` should not be served (404). If one is served, tell me.

If the number is missing from the loader line, the env vars are missing or wrong: re-check step d and redeploy.
