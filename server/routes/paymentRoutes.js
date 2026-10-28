// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyUser } = require('../middleware/auth');

router.use(verifyUser);

router.post('/confirm', paymentController.confirmPayment);
router.get('/status/:orderId', paymentController.getPaymentStatus);

module.exports = router;
