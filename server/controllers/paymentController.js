// controllers/paymentController.js
// DEMO payment flow — simulates a card payment without contacting a real
// payment gateway. This is intentional for a university project: it keeps
// no real card data and needs no external API keys.
//
// To upgrade to real Stripe payments later, replace confirmPayment's body
// with a call to Stripe's PaymentIntents API and verify the result via webhook.

const { pool } = require('../config/db');
const { notifyCustomerOrderConfirmed, notifyAdminNewOrder } = require('../services/smsService');

// -----------------------------------------------------------
// CONFIRM PAYMENT (demo)
// Simulates processing a card and marks the order as paid.
// -----------------------------------------------------------
exports.confirmPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { order_id, card_number, card_expiry, card_cvv } = req.body;
    const userId = req.user.id;

    if (!order_id || !card_number || !card_expiry || !card_cvv) {
      connection.release();
      return res.status(400).json({ success: false, message: 'order_id and card details are required.' });
    }

    // Very basic demo validation (NOT real card validation/PCI compliance —
    // this is purely to simulate success/failure for the demo).
    const cleanedCardNumber = card_number.replace(/\s/g, '');
    if (cleanedCardNumber.length < 12 || !/^\d+$/.test(cleanedCardNumber)) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Invalid card number (demo check).' });
    }

    await connection.beginTransaction();

    // Confirm order belongs to this user and is unpaid
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [order_id, userId]
    );
    if (orders.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (orders[0].payment_status === 'paid') {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ success: false, message: 'This order has already been paid.' });
    }

    // Simulate a fake transaction ID (in real Stripe integration, this comes from the API response)
    const fakeTransactionId = 'DEMO-TXN-' + Date.now();

    await connection.query(
      `UPDATE payments
       SET status = 'success', transaction_id = ?, paid_at = NOW()
       WHERE order_id = ?`,
      [fakeTransactionId, order_id]
    );

    await connection.query(
      `UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE id = ?`,
      [order_id]
    );

    await connection.commit();
    connection.release();

    // Fire SMS notifications — one to the customer confirming their order,
    // one to the restaurant owner with the order + payment details.
    // Wrapped so an SMS failure never breaks the checkout response.
    try {
      const [[customer]] = await pool.query('SELECT full_name, phone FROM users WHERE id = ?', [userId]);
      const customerPhone = customer?.phone || orders[0].phone;
      await notifyCustomerOrderConfirmed(orders[0], customerPhone);
      await notifyAdminNewOrder(orders[0], { full_name: customer?.full_name || 'Customer', phone: customerPhone });
    } catch (smsErr) {
      console.error('SMS notification error (non-fatal):', smsErr.message);
    }

    return res.json({
      success: true,
      message: 'Payment successful (demo mode).',
      transactionId: fakeTransactionId
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Confirm payment error:', error);
    return res.status(500).json({ success: false, message: 'Server error during payment.' });
  }
};

// -----------------------------------------------------------
// GET PAYMENT STATUS for an order
// -----------------------------------------------------------
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE order_id = ? AND user_id = ?',
      [orderId, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    return res.json({ success: true, payment: rows[0] });
  } catch (error) {
    console.error('Get payment status error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
