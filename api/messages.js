const { getPool } = require('./_db');
const { upsertUser } = require('./_users');

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

  const pool = getPool();

  // ── GET /api/messages ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(`
        SELECT m.id, m.content, u.name, u.nickname, m.created_at
        FROM messages m
        JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at ASC
      `);
      return res.status(200).json(rows);
    } catch (err) {
      console.error('[messages GET]', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ── POST /api/messages ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, content, nickname } = req.body ?? {};

    if (!name?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'name and content are required' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ error: 'content exceeds 1000 characters' });
    }

    try {
      const userId = await upsertUser(name.trim(), nickname?.trim());
      const { rows } = await pool.query(
        'INSERT INTO messages (user_id, content) VALUES ($1, $2) RETURNING *',
        [userId, content.trim()]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('[messages POST]', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
