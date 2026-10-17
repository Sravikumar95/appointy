const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function initDB() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = Number(process.env.DB_PORT) || 3306;
  const dbName = process.env.DB_NAME || 'appointy_db';

  console.log('--------------------------------------------------');
  console.log('Appointy Database Initializer');
  console.log(`Target: ${user}@${host}:${port}`);
  console.log('--------------------------------------------------');

  try {
    // 1. Connect without selecting database
    const conn = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });

    console.log('[1/4] Connected to MySQL server.');

    // 2. Create database if it does not exist
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`[2/4] Database \`${dbName}\` ready.`);

    // Switch to database
    await conn.changeUser({ database: dbName });

    // 3. Execute schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await conn.query(schemaSql);
    console.log('[3/4] Database tables created successfully.');

    // 4. Execute seed.sql
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await conn.query(seedSql);
    console.log('[4/4] Seed data inserted successfully.');

    await conn.end();

    console.log('--------------------------------------------------');
    console.log('Database initialized successfully!');
    console.log('');
    console.log('Default Login Credentials:');
    console.log('  Admin:   admin@appointy.com   / Admin@123');
    console.log('  Doctor:  richard@appointy.com / Doctor@123');
    console.log('  Patient: patient@appointy.com / Patient@123');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    console.error('Make sure your MySQL server is running and your .env credentials are correct.');
    process.exit(1);
  }
}

initDB();
