const crypto = require('crypto');

function sessionToken() {
  const secret = process.env.SESSION_SECRET || process.env.APP_PASSWORD || '';
  return crypto.createHmac('sha256', secret).update('fd-session-v1').digest('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const expected = process.env.APP_PASSWORD || '';
  if (!expected) {
    res.status(500).json({ error: 'APP_PASSWORD is not set in the Vercel project environment' });
    return;
  }
  const given = String((req.body && req.body.password) || '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) {
    res.status(401).json({ error: 'bad_password' });
    return;
  }
  const secure = process.env.INSECURE_COOKIE ? '' : ' Secure;';
  res.setHeader(
    'Set-Cookie',
    'fd_auth=' + sessionToken() + '; HttpOnly; Path=/; Max-Age=15552000; SameSite=Lax;' + secure
  );
  res.status(200).json({ ok: true });
};
