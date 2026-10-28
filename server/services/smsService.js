// services/smsService.js
// Sends order-related SMS notifications to customers and the restaurant owner.
//
// DEMO MODE (default): if no Twilio credentials are set in .env, messages are
// simply logged to the server console instead of being sent as real SMS. This
// lets the whole project run and be graded/demoed without needing a paid
// Twilio account. To send REAL SMS, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
// and TWILIO_PHONE_NUMBER in your .env file — the service switches over
// automatically, no code changes needed.

require('dotenv').config();

const hasTwilioCredentials = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
);

let twilioClient = null;
if (hasTwilioCredentials) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('📱 SMS service: Twilio configured — real SMS will be sent.');
  } catch (err) {
    console.warn('⚠️  Twilio package not installed/failed to load — falling back to demo SMS mode.');
  }
} else {
  console.log('📱 SMS service: running in DEMO mode (no Twilio credentials in .env) — messages will be logged to this console instead of sent.');
}

/**
 * Sends an SMS, or logs it to the console in demo mode.
 * @param {string} to - phone number, ideally E.164 format e.g. +94771234567
 * @param {string} message
 */
async function sendSms(to, message) {
  if (!to) {
    console.warn('⚠️  sendSms called with no recipient phone number — skipped.');
    return { success: false, demo: true, reason: 'no_recipient' };
  }

  if (twilioClient) {
    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      console.log(`📱 SMS sent to ${to} (sid: ${result.sid})`);
      return { success: true, demo: false, sid: result.sid };
    } catch (err) {
      console.error(`❌ Failed to send SMS to ${to}:`, err.message);
      return { success: false, demo: false, error: err.message };
    }
  }

  // Demo mode — no real SMS gateway configured, just log it clearly
  console.log(`\n📱 [DEMO SMS] To: ${to}\n   Message: ${message}\n`);
  return { success: true, demo: true };
}

// ---------------------------------------------------------------
// Specific notification helpers used by the controllers
// ---------------------------------------------------------------

// Sent to the CUSTOMER right after payment succeeds
async function notifyCustomerOrderConfirmed(order, customerPhone) {
  const message = `Mr. Chai: Your order ${order.order_number} is confirmed! Total: Rs. ${Number(order.total_amount).toLocaleString()}. We'll text you when it's out for delivery. Thank you!`;
  return sendSms(customerPhone, message);
}

// Sent to the OWNER/ADMIN right after payment succeeds, with order + payment details
async function notifyAdminNewOrder(order, customer) {
  const adminPhone = process.env.ADMIN_PHONE_NUMBER;
  if (!adminPhone) {
    console.warn('⚠️  ADMIN_PHONE_NUMBER not set in .env — owner SMS skipped.');
    return { success: false, reason: 'no_admin_phone' };
  }
  const message = `Mr. Chai NEW ORDER: ${order.order_number} from ${customer.full_name} (${customer.phone}). Total: Rs. ${Number(order.total_amount).toLocaleString()}. Payment: PAID.`;
  return sendSms(adminPhone, message);
}

// Sent to the CUSTOMER whenever the admin updates the order status
// (confirmed / preparing / out_for_delivery / delivered / cancelled).
// etaMinutes is optional and only used for the out_for_delivery message.
async function notifyCustomerStatusUpdate(order, customerPhone, status, etaMinutes) {
  const statusMessages = {
    confirmed: `Mr. Chai: Your order ${order.order_number} has been confirmed by the restaurant.`,
    preparing: `Mr. Chai: Your order ${order.order_number} is being prepared in the kitchen.`,
    out_for_delivery: etaMinutes
      ? `Mr. Chai: Your order ${order.order_number} is out for delivery! Estimated arrival: ${etaMinutes} minutes.`
      : `Mr. Chai: Your order ${order.order_number} is out for delivery!`,
    delivered: `Mr. Chai: Your order ${order.order_number} has been delivered. Enjoy your meal!`,
    cancelled: `Mr. Chai: Your order ${order.order_number} has been cancelled. Contact us if you have questions.`
  };

  const message = statusMessages[status];
  if (!message) return { success: false, reason: 'no_message_for_status' };

  return sendSms(customerPhone, message);
}

module.exports = {
  sendSms,
  notifyCustomerOrderConfirmed,
  notifyAdminNewOrder,
  notifyCustomerStatusUpdate
};
