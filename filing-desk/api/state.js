const { readSession, authConfigured } = require('../lib/session.js');

const KEY = 'fd:doc';
const MAX_BYTES = 900000;

// First-run contents (matches the last state of the claude.ai artifact version).
const SEED = {
  version: 1,
  state: {
    v: 1,
    companies: [
      { name: 'Nurothera', ticker: 'NTLX', exchange: 'TSXV', nv: false, yeMonth: 12, yeDay: 31, since: '2026-08-17', assignee: '', id: 'cmsy50zr1' }
    ],
    records: {},
    custom: [],
    people: [],
    settings: { dueSoonDays: 14 }
  }
};

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(cmd) {
  const cfg = redisConfig();
  const r = await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + cfg.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (j.error) throw new Error('redis: ' + j.error);
  return j.result;
}

module.exports = async (req, res) => {
  if (!authConfigured()) {
    res.status(503).json({ error: 'auth_not_configured' });
    return;
  }
  const user = readSession(req);
  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  if (!redisConfig()) {
    res.status(503).json({ error: 'storage_not_configured' });
    return;
  }

  if (req.method === 'GET') {
    const raw = await redis(['GET', KEY]);
    const doc = raw ? JSON.parse(raw) : SEED;
    res.status(200).json({ version: doc.version, state: doc.state, user: user });
    return;
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    if (typeof body.version !== 'number' || !body.state || typeof body.state !== 'object') {
      res.status(400).json({ error: 'bad_request' });
      return;
    }
    const raw = await redis(['GET', KEY]);
    const current = raw ? JSON.parse(raw) : SEED;
    if (current.version !== body.version) {
      res.status(409).json({ version: current.version, state: current.state, user: user });
      return;
    }
    const next = { version: current.version + 1, state: body.state };
    const payload = JSON.stringify(next);
    if (payload.length > MAX_BYTES) {
      res.status(413).json({ error: 'too_large' });
      return;
    }
    await redis(['SET', KEY, payload]);
    res.status(200).json({ version: next.version });
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
};
