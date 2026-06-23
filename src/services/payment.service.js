const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const env = require('../config/env');

const processCardPayment = async (orderId, userId, cardDetails) => {
  const order = await db.query(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = 'pending'",
    [orderId, userId]
  );

  if (order.rows.length === 0) {
    throw new AppError('Order not found or not pending payment', 400);
  }

  // Mock payment gateway validation
  // In production, integrate with Stripe/PayPal here
  const isValid = cardDetails.card_number.length === 16 &&
    /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry_date) &&
    /^\d{3,4}$/.test(cardDetails.cvv);

  if (!isValid) {
    throw new AppError('Invalid card details', 400);
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Update order to processing (payment successful)
    await client.query(
      "UPDATE orders SET status = 'processing' WHERE id = $1",
      [orderId]
    );

    // Award loyalty points
    const orderData = order.rows[0];
    if (orderData.points_earned > 0) {
      await client.query(
        'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2',
        [orderData.points_earned, userId]
      );
    }

    await client.query('COMMIT');

    return { success: true, message: 'Payment successful' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const uploadReceipt = async (orderId, userId, file) => {
  const order = await db.query(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = 'pending_verification'",
    [orderId, userId]
  );

  if (order.rows.length === 0) {
    throw new AppError('Order not found or receipt not expected', 400);
  }

  const filePath = `/uploads/${file.filename}`;

  await db.query(
    `INSERT INTO payment_receipts (order_id, file_path, original_filename)
     VALUES ($1, $2, $3)
     ON CONFLICT (order_id) DO UPDATE SET file_path = $2, original_filename = $3, uploaded_at = NOW()`,
    [orderId, filePath, file.originalname]
  );

  return { success: true, message: 'Receipt uploaded successfully' };
};

module.exports = { processCardPayment, uploadReceipt };
