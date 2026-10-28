// controllers/orderController.js
// Handles checkout (turning a cart into an order), order history, and
// admin-side order status management.
//
// Checkout uses a MySQL transaction: if any step fails (e.g. price mismatch,
// DB error), everything rolls back so we never end up with a half-created order.

const { pool } = require('../config/db');
const { notifyCustomerStatusUpdate } = require('../services/smsService');

// Generates a human-friendly order number, e.g. MC-20260714-8291
function generateOrderNumber() {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `MC-${datePart}-${randomPart}`;
}

// -----------------------------------------------------------
// CHECKOUT: create an order from the user's current cart
// -----------------------------------------------------------
exports.checkout = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { delivery_address, phone, notes } = req.body;
    const userId = req.user.id;

    if (!delivery_address || !phone) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Delivery address and phone are required.' });
    }

    await connection.beginTransaction();

    // 1. Get current cart items with live food prices (never trust prices from the client)
    const [cartItems] = await connection.query(
      `SELECT c.food_id, c.quantity, f.name AS food_name, f.price, f.is_available
       FROM cart c
       JOIN foods f ON f.id = c.food_id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const unavailable = cartItems.find(item => !item.is_available);
    if (unavailable) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({
        success: false,
        message: `"${unavailable.food_name}" is no longer available. Please remove it from your cart.`
      });
    }

    // 2. Calculate total on the server side
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 3. Create the order
    const orderNumber = generateOrderNumber();
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, order_number, total_amount, delivery_address, phone, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, orderNumber, totalAmount, delivery_address, phone, notes || null]
    );
    const orderId = orderResult.insertId;

    // 4. Create order_items (snapshotting name & price at time of order)
    const orderItemsValues = cartItems.map(item => [
      orderId, item.food_id, item.food_name, item.price, item.quantity, item.price * item.quantity
    ]);
    await connection.query(
      `INSERT INTO order_items (order_id, food_id, food_name, price, quantity, subtotal) VALUES ?`,
      [orderItemsValues]
    );

    // 5. Clear the cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    // 6. Create a pending payment record (actual payment is confirmed via payment controller)
    await connection.query(
      `INSERT INTO payments (order_id, user_id, amount, method, status) VALUES (?, ?, ?, 'demo_card', 'pending')`,
      [orderId, userId, totalAmount]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: 'Order created successfully. Proceed to payment.',
      order: { id: orderId, order_number: orderNumber, total_amount: totalAmount }
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Checkout error:', error);
    return res.status(500).json({ success: false, message: 'Server error during checkout.' });
  }
};

// -----------------------------------------------------------
// CUSTOMER: order history
// -----------------------------------------------------------
exports.getMyOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ success: true, orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// CUSTOMER: single order detail (with items) — ownership checked
// -----------------------------------------------------------
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);

    return res.json({ success: true, order: orders[0], items });
  } catch (error) {
    console.error('Get order by id error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// ADMIN: list all orders (optionally filter by status)
// -----------------------------------------------------------
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT o.*, u.full_name, u.email
      FROM orders o
      JOIN users u ON u.id = o.user_id
    `;
    const params = [];

    if (status) {
      query += ' WHERE o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.query(query, params);
    return res.json({ success: true, orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// ADMIN: get single order with items (any user)
// -----------------------------------------------------------
exports.getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT o.*, u.full_name, u.email FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
      [id]
    );
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);

    return res.json({ success: true, order: orders[0], items });
  } catch (error) {
    console.error('Get order by id (admin) error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// ADMIN: update order status
// -----------------------------------------------------------
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, eta_minutes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Text the customer about their new order status (non-fatal if it fails)
    try {
      const [[orderRow]] = await pool.query(
        `SELECT o.*, u.phone AS user_phone FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
        [id]
      );
      if (orderRow) {
        const customerPhone = orderRow.phone || orderRow.user_phone;
        await notifyCustomerStatusUpdate(orderRow, customerPhone, status, eta_minutes);
      }
    } catch (smsErr) {
      console.error('SMS notification error (non-fatal):', smsErr.message);
    }

    return res.json({ success: true, message: `Order status updated to "${status}".` });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
