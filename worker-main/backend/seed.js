import bcrypt from 'bcryptjs';
import pool from './db.js';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.execute(
      `INSERT IGNORE INTO users (name, email, password_hash, type) VALUES (?, ?, ?, ?)`,
      ['Admin', 'admin@worker.com', hash, 'admin']
    );
    console.log('Admin user created: admin@worker.com / admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
