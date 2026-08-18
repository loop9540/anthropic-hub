# Filing Desk

Continuous disclosure tracker for TSXV and CSE issuers. Static front end
(`index.html`) plus Vercel serverless functions: Google sign-in
(`api/auth.js`, `api/callback.js`, `api/logout.js`) and a state endpoint
(`api/state.js`) storing one JSON document in Upstash Redis with
optimistic version checks.

## Deploy to Vercel

1. **Import the repo** — at vercel.com: *Add New → Project*, import this
   GitHub repository. Set **Root Directory** to `filing-desk` (important —
   the repo root is a different site). Framework preset: *Other*. No build
   command, no output directory.
2. **Attach storage** — in the project: *Storage → Create Database →
   Upstash (Redis)*, free plan, connect it. This injects
   `KV_REST_API_URL` / `KV_REST_API_TOKEN` automatically.
3. **Create a Google OAuth client** — at console.cloud.google.com:
   *APIs & Services → Credentials → Create Credentials → OAuth client ID*,
   type **Web application**. (First-time: configure the consent screen —
   External, app name "Filing Desk", your email; no scopes beyond the
   defaults; add yourself and your teammate as test users, or publish.)
   Add the **Authorized redirect URI**:
   `https://<your-project>.vercel.app/api/callback`
   (add your custom domain's `/api/callback` too if you attach one).
4. **Set environment variables** — in *Settings → Environment Variables*:
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from step 3.
   - `ALLOWED_EMAILS` — comma-separated Google account emails allowed in,
     e.g. `you@gmail.com, hire@gmail.com`. Anyone else is rejected.
   - `SESSION_SECRET` — any long random string (signs the login cookie).
5. **Deploy** (redeploy after adding env vars if the first build already
   ran). Sign in with a listed Google account; names on check-off stamps
   come from the Google profile.

## How it works

- Google OAuth (authorization-code flow, implemented directly — no
  dependencies). The callback validates the id_token via Google's
  tokeninfo endpoint, checks the email against `ALLOWED_EMAILS`, and sets
  a signed HttpOnly session cookie (30 days). `/api/logout` signs out.
- The whole dashboard state is one JSON document in Redis, written with a
  version counter: a stale save gets a 409 and the page reloads the newer
  state instead of overwriting it. Open pages poll every 45 s.
- On first run (empty Redis) the API seeds the data carried over from the
  claude.ai artifact version of the dashboard.
- Every check-off and mark-filed is stamped with the signed-in Google
  account's name — identity is verified, not self-declared.

## Local development

Run a harness that serves `index.html`, mounts the `api/` functions, and
fakes Google + Redis (see the session's `test-server.mjs` pattern). Env:
`SESSION_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `ALLOWED_EMAILS`,
`KV_REST_API_URL/TOKEN`, plus `GOOGLE_AUTH_URL`, `GOOGLE_TOKEN_URL`,
`GOOGLE_TOKENINFO_URL` pointed at the fakes and `INSECURE_COOKIE=1` for
http.
