const { getPool } = require('../_db');
const { upsertUser } = require('../_users');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

function setCors(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── POST /api/donations ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, amount, method, bank, nickname } = req.body ?? {};

    if (!name?.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    try {
      const pool = getPool();
      const userId = await upsertUser(name.trim(), nickname?.trim());
      const { rows } = await pool.query(
        'INSERT INTO donations (user_id, amount, method, bank) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, parsedAmount, method ?? null, bank ?? null]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('[donations POST]', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
