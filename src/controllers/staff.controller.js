const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const orderService = require('../services/order.service');
const env = require('../config/env');

// Get all orders with optional status filter
const getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` WHERE o.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders';
    const countParams = [];
    if (status) {
      countQuery += ' WHERE status = $1';
      countParams.push(status);
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

// Get single order detail (staff view)
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// Verify payment for online banking orders
const verifyPayment = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await db.query(
      "SELECT * FROM orders WHERE id = $1 AND status = 'pending_verification'",
      [orderId]
    );

    if (order.rows.length === 0) {
      throw new AppError('Order not found or not pending verification', 400);
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        "UPDATE orders SET status = 'processing' WHERE id = $1",
        [orderId]
      );

      // Award loyalty points
      const orderData = order.rows[0];
      if (orderData.points_earned > 0) {
        await client.query(
          'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2',
          [orderData.points_earned, orderData.user_id]
        );
      }

      await client.query('COMMIT');

      res.json({ message: 'Payment verified and order is now processing' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// Update order status to shipped with tracking
const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { tracking_id, expected_delivery } = req.validatedBody;

    const order = await db.query(
      "SELECT * FROM orders WHERE id = $1 AND status = 'processing'",
      [orderId]
    );

    if (order.rows.length === 0) {
      throw new AppError('Order not found or not in processing status', 400);
    }

    await db.query(
      "UPDATE orders SET status = 'shipped', tracking_id = $1, expected_delivery = $2 WHERE id = $3",
      [tracking_id, expected_delivery || null, orderId]
    );

    res.json({ message: 'Order status updated to shipped' });
  } catch (err) {
    next(err);
  }
};

// Get pending cancellation requests
const getCancellations = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT cr.*, o.total_amount, o.payment_method, o.status as order_status,
              u.name as customer_name, u.email as customer_email
       FROM cancellation_requests cr
       JOIN orders o ON cr.order_id = o.id
       JOIN users u ON o.user_id = u.id
       ORDER BY cr.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Approve cancellation
const approveCancellation = async (req, res, next) => {
  try {
    const cancelId = req.params.id;

    const cancel = await db.query(
      "SELECT cr.*, o.user_id, o.points_used, o.points_earned, o.total_amount FROM cancellation_requests cr JOIN orders o ON cr.order_id = o.id WHERE cr.id = $1 AND cr.status = 'pending'",
      [cancelId]
    );

    if (cancel.rows.length === 0) {
      throw new AppError('Cancellation request not found or already processed', 400);
    }

    const cancelData = cancel.rows[0];
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Update cancellation request
      await client.query(
        "UPDATE cancellation_requests SET status = 'approved' WHERE id = $1",
        [cancelId]
      );

      // Update order status
      await client.query(
        "UPDATE orders SET status = 'cancelled' WHERE id = $1",
        [cancelData.order_id]
      );

      // Restore loyalty points if they were used
      if (cancelData.points_used > 0) {
        await client.query(
          'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2',
          [cancelData.points_used, cancelData.user_id]
        );
      }

      // Remove earned points if they were awarded
      if (cancelData.points_earned > 0) {
        await client.query(
          'UPDATE users SET loyalty_points = GREATEST(0, loyalty_points - $1) WHERE id = $2',
          [cancelData.points_earned, cancelData.user_id]
        );
      }

      // Restore stock
      const orderItems = await client.query(
        'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
        [cancelData.order_id]
      );

      for (const item of orderItems.rows) {
        await client.query(
          'UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.variant_id]
        );
      }

      await client.query('COMMIT');

      res.json({ message: 'Cancellation approved, order cancelled' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// Reject cancellation
const rejectCancellation = async (req, res, next) => {
  try {
    const cancelId = req.params.id;

    const cancel = await db.query(
      "SELECT cr.*, o.status as current_order_status FROM cancellation_requests cr JOIN orders o ON cr.order_id = o.id WHERE cr.id = $1 AND cr.status = 'pending'",
      [cancelId]
    );

    if (cancel.rows.length === 0) {
      throw new AppError('Cancellation request not found or already processed', 400);
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        "UPDATE cancellation_requests SET status = 'rejected', staff_notes = $1 WHERE id = $2",
        [req.body.notes || null, cancelId]
      );

      // Restore order to processing
      await client.query(
        "UPDATE orders SET status = 'processing' WHERE id = $1",
        [cancel.rows[0].order_id]
      );

      await client.query('COMMIT');

      res.json({ message: 'Cancellation rejected' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// Dashboard stats
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending_verification') as pending_verification,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
        COUNT(*) FILTER (WHERE status = 'pending_cancellation') as pending_cancellation,
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending', 'pending_verification')), 0) as total_revenue
      FROM orders
    `);

    const recentOrders = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, u.name as customer_name
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 5`
    );

    res.json({
      stats: stats.rows[0],
      recentOrders: recentOrders.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrders, getOrderById, verifyPayment, updateOrderStatus,
  getCancellations, approveCancellation, rejectCancellation,
  getDashboardStats,
};
