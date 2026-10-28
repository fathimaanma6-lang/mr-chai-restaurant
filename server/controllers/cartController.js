// controllers/cartController.js
// Manages the logged-in customer's shopping cart.
// All routes here are protected (req.user.id comes from the JWT).

const { pool } = require('../config/db');

// -----------------------------------------------------------
// GET CART (with food details + calculated subtotal per item)
// -----------------------------------------------------------
exports.getCart = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id AS cart_id, c.quantity, f.id AS food_id, f.name, f.price, f.image,
              (c.quantity * f.price) AS subtotal
       FROM cart c
       JOIN foods f ON f.id = c.food_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    const total = rows.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return res.json({ success: true, items: rows, total });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// ADD TO CART (or increase quantity if already in cart)
// -----------------------------------------------------------
exports.addToCart = async (req, res) => {
  try {
    const { food_id, quantity } = req.body;
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;

    if (!food_id) {
      return res.status(400).json({ success: false, message: 'food_id is required.' });
    }

    // Confirm food exists and is available
    const [foodRows] = await pool.query('SELECT id FROM foods WHERE id = ? AND is_available = 1', [food_id]);
    if (foodRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Food item not found or unavailable.' });
    }

    // Upsert: if this user already has this food in cart, increase quantity instead of duplicating
    await pool.query(
      `INSERT INTO cart (user_id, food_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, food_id, qty]
    );

    return res.json({ success: true, message: 'Item added to cart.' });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// UPDATE CART ITEM QUANTITY
// -----------------------------------------------------------
exports.updateCartItem = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { quantity } = req.body;

    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    }

    const [result] = await pool.query(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, cartId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    return res.json({ success: true, message: 'Cart updated.' });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// REMOVE ITEM FROM CART
// -----------------------------------------------------------
exports.removeCartItem = async (req, res) => {
  try {
    const { cartId } = req.params;

    const [result] = await pool.query(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [cartId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    return res.json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// CLEAR ENTIRE CART (used after checkout, or a "clear cart" button)
// -----------------------------------------------------------
exports.clearCart = async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
