const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const env = require('../config/env');
const cartService = require('./cart.service');
const loyaltyService = require('./loyalty.service');

const createOrder = async (userId, { shipping_address, shipping_name, shipping_phone, payment_method, points_to_use = 0 }) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Get cart items
    const cartResult = await client.query(
      `SELECT ci.quantity, ci.variant_id,
              pv.price, pv.stock_quantity, pv.size,
              p.name as product_name
       FROM cart_items ci
       JOIN product_variants pv ON ci.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // Calculate total
    let subtotal = 0;
    for (const item of cartResult.rows) {
      if (item.stock_quantity < item.quantity) {
        throw new AppError(`Insufficient stock for ${item.product_name} (${item.size})`, 400);
      }
      subtotal += item.price * item.quantity;
    }

    // Handle loyalty points deduction
    let pointsDiscount = 0;
    let pointsUsed = 0;
    if (points_to_use > 0) {
      const userResult = await client.query('SELECT loyalty_points FROM users WHERE id = $1', [userId]);
      const availablePoints = userResult.rows[0].loyalty_points;

      if (points_to_use > availablePoints) {
        throw new AppError('Insufficient loyalty points', 400);
      }

      pointsUsed = points_to_use;
      pointsDiscount = pointsUsed / env.pointsToDollar;

      if (pointsDiscount > subtotal) {
        pointsDiscount = subtotal;
        pointsUsed = Math.ceil(subtotal * env.pointsToDollar);
      }
    }

    const totalAmount = Math.max(0, subtotal - pointsDiscount);
    const totalAmountRounded = parseFloat(totalAmount.toFixed(2));

    // Calculate points earned (no points if using points)
    const pointsEarned = pointsUsed > 0 ? 0 : Math.floor(totalAmountRounded * env.pointsPerDollar);

    // Set initial status based on payment method
    const initialStatus = payment_method === 'card' ? 'pending' : 'pending_verification';

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_amount, points_used, points_earned, payment_method, shipping_address, shipping_name, shipping_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, initialStatus, totalAmountRounded, pointsUsed, pointsEarned, payment_method, shipping_address, shipping_name, shipping_phone]
    );

    const order = orderResult.rows[0];

    // Create order items and decrement stock
    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, product_name, product_size, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.variant_id, item.product_name, item.size, item.quantity, item.price]
      );

      await client.query(
        'UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.variant_id]
      );
    }

    // Deduct loyalty points if used
    if (pointsUsed > 0) {
      await client.query(
        'UPDATE users SET loyalty_points = loyalty_points - $1 WHERE id = $2',
        [pointsUsed, userId]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getOrders = async (userId) => {
  const result = await db.query(
    `SELECT o.*,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
     FROM orders o
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getOrderById = async (orderId, userId = null) => {
  let query = `
    SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = $1
  `;
  const params = [orderId];

  if (userId) {
    query += ' AND o.user_id = $2';
    params.push(userId);
  }

  const orderResult = await db.query(query, params);

  if (orderResult.rows.length === 0) return null;

  const itemsResult = await db.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId]
  );

  const receiptResult = await db.query(
    'SELECT * FROM payment_receipts WHERE order_id = $1',
    [orderId]
  );

  const cancellationResult = await db.query(
    'SELECT * FROM cancellation_requests WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );

  return {
    ...orderResult.rows[0],
    items: itemsResult.rows,
    receipt: receiptResult.rows[0] || null,
    cancellation: cancellationResult.rows[0] || null,
  };
};

const requestCancellation = async (orderId, userId, reason) => {
  const order = await db.query(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'processing', 'pending_verification')",
    [orderId, userId]
  );

  if (order.rows.length === 0) {
    throw new AppError('Order not found or cannot be cancelled', 400);
  }

  // Check if there's already a pending cancellation
  const existing = await db.query(
    "SELECT id FROM cancellation_requests WHERE order_id = $1 AND status = 'pending'",
    [orderId]
  );

  if (existing.rows.length > 0) {
    throw new AppError('Cancellation request already pending', 400);
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      "UPDATE orders SET status = 'pending_cancellation' WHERE id = $1",
      [orderId]
    );

    const result = await client.query(
      'INSERT INTO cancellation_requests (order_id, reason) VALUES ($1, $2) RETURNING *',
      [orderId, reason]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { createOrder, getOrders, getOrderById, requestCancellation };
