// app.js
// Main entry point for the Mr. Chai Restaurant backend API.

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');

// Route files
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const foodRoutes = require('./routes/foodRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ---------- Global middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically, e.g. http://localhost:5000/uploads/food-123.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Mr. Chai Restaurant API is running.' });
});

// ---------- API routes ----------
app.use('/api/auth', authRoutes);           // customer register/login/profile
app.use('/api/categories', categoryRoutes); // menu categories
app.use('/api/foods', foodRoutes);          // menu items
app.use('/api/cart', cartRoutes);           // shopping cart
app.use('/api/orders', orderRoutes);        // checkout & order management
app.use('/api/payments', paymentRoutes);    // demo payment flow
app.use('/api/admin', adminRoutes);         // admin login & dashboard

// ---------- 404 handler ----------
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ---------- Global error handler (e.g. Multer file errors) ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Something went wrong.' });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;

(async () => {
  await testConnection(); // fail fast if DB credentials are wrong
  app.listen(PORT, () => {
    console.log(`🚀 Mr. Chai Restaurant API running on http://localhost:${PORT}`);
  });
})();
