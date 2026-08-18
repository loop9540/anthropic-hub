const { makeSession, cookieHeader, checkState, baseUrl, allowedEmail, authConfigured } = require('../lib/session.js');

function fail(res, code) {
  res.statusCode = 302;
  res.setHeader('Location', '/?err=' + code);
  res.end();
}

module.exports = async (req, res) => {
  if (!authConfigured()) { fail(res, 'config'); return; }
  const url = new URL(req.url, baseUrl(req));
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !checkState(state)) { fail(res, 'oauth'); return; }

  const tokenUrl = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: baseUrl(req) + '/api/callback',
      grant_type: 'authorization_code'
    })
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.id_token) { fail(res, 'oauth'); return; }

  // Let Google validate the id_token's signature; we check audience + email.
  const infoUrl = (process.env.GOOGLE_TOKENINFO_URL || 'https://oauth2.googleapis.com/tokeninfo') +
    '?id_token=' + encodeURIComponent(tokens.id_token);
  const infoRes = await fetch(infoUrl);
  const claims = await infoRes.json();
  if (!infoRes.ok || claims.aud !== process.env.GOOGLE_CLIENT_ID) { fail(res, 'oauth'); return; }
  if (String(claims.email_verified) !== 'true') { fail(res, 'oauth'); return; }
  if (!allowedEmail(claims.email)) { fail(res, 'denied'); return; }

  res.setHeader('Set-Cookie', cookieHeader(makeSession(claims.email, claims.name || claims.email), 30 * 24 * 3600));
  res.statusCode = 302;
  res.setHeader('Location', '/');
  res.end();
};
