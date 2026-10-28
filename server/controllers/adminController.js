// controllers/adminController.js
// Handles admin login, dashboard summary stats, customer management, and sales report.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

// -----------------------------------------------------------
// ADMIN LOGIN
// -----------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '1d' }
    );

    return res.json({
      success: true,
      message: 'Admin login successful.',
      token,
      admin: { id: admin.id, full_name: admin.full_name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// DASHBOARD SUMMARY (protected)
// Returns key numbers shown on the admin dashboard home page.
// -----------------------------------------------------------
exports.getDashboardStats = async (req, res) => {
  try {
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalCustomers }]] = await pool.query('SELECT COUNT(*) AS totalCustomers FROM users');
    const [[{ totalRevenue }]] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders WHERE payment_status = 'paid'"
    );
    const [[{ pendingOrders }]] = await pool.query(
      "SELECT COUNT(*) AS pendingOrders FROM orders WHERE status = 'pending'"
    );
    const [recentOrders] = await pool.query(
      `SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at, u.full_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    return res.json({
      success: true,
      stats: { totalOrders, totalCustomers, totalRevenue, pendingOrders },
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// MANAGE CUSTOMERS (protected)
// -----------------------------------------------------------
exports.getCustomers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, status, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json({ success: true, customers: rows });
  } catch (error) {
    console.error('Get customers error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'blocked'

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'active' or 'blocked'." });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    return res.json({ success: true, message: `Customer status updated to ${status}.` });
  } catch (error) {
    console.error('Update customer status error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// SALES REPORT (protected)
// Accepts optional ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD query params.
// -----------------------------------------------------------
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT DATE(o.created_at) AS date,
             COUNT(*) AS totalOrders,
             SUM(o.total_amount) AS totalRevenue
      FROM orders o
      WHERE o.payment_status = 'paid'
    `;
    const params = [];

    if (startDate && endDate) {
      query += ' AND DATE(o.created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' GROUP BY DATE(o.created_at) ORDER BY date DESC';

    const [rows] = await pool.query(query, params);

    // Also fetch best-selling items
    const [topItems] = await pool.query(
      `SELECT oi.food_name, SUM(oi.quantity) AS totalSold, SUM(oi.subtotal) AS totalRevenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.payment_status = 'paid'
       GROUP BY oi.food_name
       ORDER BY totalSold DESC
       LIMIT 10`
    );

    return res.json({ success: true, dailyReport: rows, topItems });
  } catch (error) {
    console.error('Sales report error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
