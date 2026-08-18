const { cookieHeader } = require('../lib/session.js');

module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', cookieHeader('', 0));
  res.statusCode = 302;
  res.setHeader('Location', '/');
  res.end();
};
