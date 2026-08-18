const { makeState, baseUrl, authConfigured } = require('../lib/session.js');

module.exports = async (req, res) => {
  if (!authConfigured()) {
    res.status(503).json({ error: 'auth_not_configured' });
    return;
  }
  const authBase = process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: baseUrl(req) + '/api/callback',
    response_type: 'code',
    scope: 'openid email profile',
    state: makeState(),
    prompt: 'select_account'
  });
  res.statusCode = 302;
  res.setHeader('Location', authBase + '?' + params.toString());
  res.end();
};
