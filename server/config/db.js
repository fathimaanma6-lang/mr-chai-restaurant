// config/db.js
// Creates a reusable MySQL connection pool using mysql2/promise.
// A pool is used instead of a single connection so multiple requests
// can be handled at the same time without waiting on one connection.

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mr_chai_restaurant',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

// Quick test function you can call on server startup to confirm
// the database credentials/connection are working.
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully to database:', process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1); // stop the server if DB is not reachable
  }
}

module.exports = { pool, testConnection };
