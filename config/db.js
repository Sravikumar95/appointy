const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'appointy_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection helper
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[DB] Connected successfully to MySQL database "${process.env.DB_NAME || 'appointy_db'}"`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[DB] Database connection failed:', error.message);
    console.error('[DB] Tip: Run `npm run init-db` to create the database and seed tables.');
    return false;
  }
}

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  testConnection
};
