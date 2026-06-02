const { getPool } = require('../_db');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

function setCors(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET /api/donations/latest ──────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const pool = getPool();
      const { rows } = await pool.query(`
        SELECT d.id, d.amount, d.method, d.bank, d.created_at,
               u.name, u.nickname
        FROM donations d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
        LIMIT 1
      `);
      return res.status(200).json(rows[0] ?? null);
    } catch (err) {
      console.error('[donations/latest GET]', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
