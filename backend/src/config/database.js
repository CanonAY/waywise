const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
  process.exit(-1);
});

// Test connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection test successful');
  } catch (err) {
    logger.error('Database connection test failed:', err);
    process.exit(-1);
  }
};

// Initialize database connection
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};