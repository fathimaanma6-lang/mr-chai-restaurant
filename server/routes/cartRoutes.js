// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyUser } = require('../middleware/auth');

// All cart routes require a logged-in customer
router.use(verifyUser);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:cartId', cartController.updateCartItem);
router.delete('/:cartId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
