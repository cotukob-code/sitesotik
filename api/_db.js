const { Pool } = require('pg');

/** @type {Pool | null} */
let pool = null;

/**
 * Returns a shared Pool instance (singleton per cold start).
 * Vercel serverless functions reuse the module between invocations
 * within the same execution context, so this avoids connection churn.
 */
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1,                    // serverless: keep it tight
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });

    pool.on('error', (err) => {
      console.error('[_db] Unexpected pool error:', err.message);
      pool = null; // force re-init on next request
    });
  }
  return pool;
}

module.exports = { getPool };
