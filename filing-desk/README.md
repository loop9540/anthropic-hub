# Filing Desk

Continuous disclosure tracker for TSXV and CSE issuers. Static front end
(`index.html`) plus two Vercel serverless functions (`api/login.js`,
`api/state.js`) storing one JSON document in Upstash Redis with optimistic
version checks.

## Deploy to Vercel

1. **Import the repo** — at vercel.com: *Add New → Project*, import this
   GitHub repository. Set **Root Directory** to `filing-desk` (important —
   the repo root is a different site). Framework preset: *Other*. No build
   command, no output directory.
2. **Attach storage** — in the project: *Storage → Create Database →
   Upstash (Redis)*, free plan, connect it to the project. This injects
   `KV_REST_API_URL` / `KV_REST_API_TOKEN` automatically.
3. **Set environment variables** — in *Settings → Environment Variables*:
   - `APP_PASSWORD` — the access code you and your teammate will type to
     enter the dashboard (pick something strong).
   - `SESSION_SECRET` — any long random string (used to sign the login
     cookie). E.g. run `openssl rand -hex 32`.
4. **Deploy** (redeploy after adding the env vars if the first build
   already ran). The dashboard is then live at the project URL, e.g.
   `https://filing-desk-xxxx.vercel.app`, and you can add a custom domain
   under *Settings → Domains*.

## How it works

- Everyone shares one access code (`APP_PASSWORD`); a signed HttpOnly
  cookie keeps you logged in for ~6 months per browser.
- The whole dashboard state is one JSON document in Redis, written with a
  version counter: a stale save gets a 409 and the page reloads the newer
  state instead of overwriting it. Open pages also poll every 45 s to pick
  up each other's changes.
- On first run (empty Redis) the API seeds the data carried over from the
  claude.ai artifact version of the dashboard.
- Each check-off is stamped with the name chosen in the in-app "Who are
  you?" picker (stored per browser).

## Local development

`node scratchpad/test-server.mjs`-style harness: any static server for
`index.html` plus the two functions behind `/api/*` with `APP_PASSWORD`,
`SESSION_SECRET`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` set
(`INSECURE_COOKIE=1` disables the cookie's `Secure` flag for http).
