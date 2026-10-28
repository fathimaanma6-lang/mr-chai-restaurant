// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/auth');

// Public
router.post('/login', adminController.login);

// Protected (admin only)
router.get('/dashboard', verifyAdmin, adminController.getDashboardStats);
router.get('/customers', verifyAdmin, adminController.getCustomers);
router.put('/customers/:id/status', verifyAdmin, adminController.updateCustomerStatus);
router.get('/sales-report', verifyAdmin, adminController.getSalesReport);

module.exports = router;
