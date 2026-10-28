// seed/seedAdmin.js
// Run with: npm run seed:admin
// Creates (or updates) the default admin account using a properly
// generated bcrypt hash — replacing the placeholder hash from restaurant.sql.

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
require('dotenv').config();

async function seedAdmin() {
  try {
    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@mrchai.com';
    const plainPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const [existing] = await pool.query('SELECT id FROM admins WHERE email = ?', [email]);

    if (existing.length > 0) {
      await pool.query('UPDATE admins SET password = ? WHERE email = ?', [hashedPassword, email]);
      console.log(`✅ Existing admin "${email}" password updated.`);
    } else {
      await pool.query(
        'INSERT INTO admins (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Super Admin', email, hashedPassword, 'super_admin']
      );
      console.log(`✅ Admin account created: ${email}`);
    }

    console.log(`   Login with email: ${email}  password: ${plainPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();
