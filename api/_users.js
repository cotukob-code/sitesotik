const { getPool } = require('./_db');

/**
 * Finds an existing user by name or creates a new one.
 * Optionally updates the nickname if it wasn't set before.
 *
 * @param {string} name
 * @param {string | undefined} nickname
 * @returns {Promise<number>} userId
 */
async function upsertUser(name, nickname) {
  const pool = getPool();

  const { rows } = await pool.query(
    'SELECT id, nickname FROM users WHERE name = $1 LIMIT 1',
    [name]
  );

  if (rows.length === 0) {
    const ins = await pool.query(
      'INSERT INTO users (name, nickname) VALUES ($1, $2) RETURNING id',
      [name, nickname ?? null]
    );
    return ins.rows[0].id;
  }

  const user = rows[0];
  if (nickname && !user.nickname) {
    await pool.query('UPDATE users SET nickname = $1 WHERE id = $2', [nickname, user.id]);
  }
  return user.id;
}

module.exports = { upsertUser };
