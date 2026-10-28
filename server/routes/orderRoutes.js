// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyUser, verifyAdmin } = require('../middleware/auth');

// Customer routes
router.post('/checkout', verifyUser, orderController.checkout);
router.get('/my-orders', verifyUser, orderController.getMyOrders);
router.get('/my-orders/:id', verifyUser, orderController.getOrderById);

// Admin routes
router.get('/admin/all', verifyAdmin, orderController.getAllOrders);
router.get('/admin/:id', verifyAdmin, orderController.getOrderByIdAdmin);
router.put('/admin/:id/status', verifyAdmin, orderController.updateOrderStatus);

module.exports = router;
