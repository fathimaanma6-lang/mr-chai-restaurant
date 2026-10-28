// middleware/auth.js
// Verifies JWT tokens for protected routes.
// Two separate verifiers are used: one for customers, one for admins,
// so an admin token can never be used to access customer-only routes and vice versa.

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Protects customer routes (cart, orders, profile, etc.)
function verifyUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.user = decoded; // { id, email }
    next();
  });
}

// Protects admin routes (dashboard, manage foods, manage orders, etc.)
function verifyAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No admin token provided.' });
  }

  jwt.verify(token, process.env.ADMIN_JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired admin token.' });
    }
    req.admin = decoded; // { id, email, role }
    next();
  });
}

module.exports = { verifyUser, verifyAdmin };
