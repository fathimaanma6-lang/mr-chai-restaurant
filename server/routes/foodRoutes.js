// routes/foodRoutes.js
const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', foodController.getAllFoods);
router.get('/search', foodController.searchFoods);
router.get('/:id', foodController.getFoodById);

// Admin routes
router.get('/admin/all', verifyAdmin, foodController.getAllFoodsAdmin);
router.post('/', verifyAdmin, upload.single('image'), foodController.createFood);
router.put('/:id', verifyAdmin, upload.single('image'), foodController.updateFood);
router.delete('/:id', verifyAdmin, foodController.deleteFood);

module.exports = router;
