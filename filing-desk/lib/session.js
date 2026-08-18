const crypto = require('crypto');

function secret() {
  return process.env.SESSION_SECRET || '';
}

function hmac(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

// Session cookie: base64url(JSON{e,n,x}) + '.' + hmac
function makeSession(email, name) {
  const payload = Buffer.from(JSON.stringify({
    e: email,
    n: name,
    x: Date.now() + 30 * 24 * 3600 * 1000
  })).toString('base64url');
  return payload + '.' + hmac(payload);
}

function readSession(req) {
  const cookies = String(req.headers.cookie || '').split(/;\s*/);
  for (const c of cookies) {
    if (!c.startsWith('fd_sess=')) continue;
    const val = c.slice('fd_sess='.length);
    const dot = val.lastIndexOf('.');
    if (dot < 0) return null;
    const payload = val.slice(0, dot);
    const sig = val.slice(dot + 1);
    const expect = hmac(payload);
    const a = Buffer.from(sig), b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (!data.e || !data.x || Date.now() > data.x) return null;
      return { email: data.e, name: data.n || data.e };
    } catch (e) { return null; }
  }
  return null;
}

function cookieHeader(value, maxAge) {
  const secure = process.env.INSECURE_COOKIE ? '' : ' Secure;';
  return 'fd_sess=' + value + '; HttpOnly; Path=/; Max-Age=' + maxAge + '; SameSite=Lax;' + secure;
}

// CSRF state for the OAuth round-trip: timestamp + '.' + hmac
function makeState() {
  const ts = String(Date.now());
  return ts + '.' + hmac('state:' + ts);
}

function checkState(state) {
  const dot = String(state || '').lastIndexOf('.');
  if (dot < 0) return false;
  const ts = state.slice(0, dot), sig = state.slice(dot + 1);
  const expect = hmac('state:' + ts);
  const a = Buffer.from(sig), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Date.now() - Number(ts) < 10 * 60 * 1000;
}

function baseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return proto + '://' + host;
}

function allowedEmail(email) {
  const list = String(process.env.ALLOWED_EMAILS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return list.length > 0 && list.indexOf(String(email).toLowerCase()) !== -1;
}

function authConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
            process.env.SESSION_SECRET && process.env.ALLOWED_EMAILS);
}

module.exports = { makeSession, readSession, cookieHeader, makeState, checkState, baseUrl, allowedEmail, authConfigured };
