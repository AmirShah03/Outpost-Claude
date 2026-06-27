const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const generateReport = async (month, year, staffId) => {
  // Check if report already exists
  const existing = await db.query(
    'SELECT id FROM reports WHERE month = $1 AND year = $2',
    [month, year]
  );

  if (existing.rows.length > 0) {
    throw new AppError('Report for this month already exists. Delete it first to regenerate.', 400);
  }

  // Get all orders for the month
  const ordersResult = await db.query(
    `SELECT o.id, o.total_amount, o.payment_method, o.status, o.created_at,
            u.name as customer_name
     FROM orders o
     JOIN users u ON o.user_id = u.id
     WHERE EXTRACT(MONTH FROM o.created_at) = $1
       AND EXTRACT(YEAR FROM o.created_at) = $2
       AND o.status NOT IN ('cancelled', 'pending', 'pending_verification')
     ORDER BY o.created_at ASC`,
    [month, year]
  );

  const orders = ordersResult.rows;

  // Aggregate data
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const cardPayments = orders.filter(o => o.payment_method === 'card').length;
  const bankingPayments = orders.filter(o => o.payment_method === 'online_banking').length;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const data = {
    total_orders: orders.length,
    total_revenue: totalRevenue,
    card_payments: cardPayments,
    banking_payments: bankingPayments,
    orders: orders.map(o => ({
      id: o.id,
      customer_name: o.customer_name,
      total: parseFloat(o.total_amount),
      payment_method: o.payment_method,
      status: o.status,
      date: o.created_at,
    })),
  };

  const result = await db.query(
    `INSERT INTO reports (month, year, title, generated_by, data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [month, year, `${monthNames[month - 1]} ${year} Sales Report`, staffId, JSON.stringify(data)]
  );

  return result.rows[0];
};

const getReports = async () => {
  const result = await db.query(
    `SELECT r.*, u.name as generated_by_name
     FROM reports r
     LEFT JOIN users u ON r.generated_by = u.id
     ORDER BY r.year DESC, r.month DESC`
  );
  return result.rows;
};

const getReportById = async (id) => {
  const result = await db.query(
    `SELECT r.*, u.name as generated_by_name
     FROM reports r
     LEFT JOIN users u ON r.generated_by = u.id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const updateReport = async (id, updates) => {
  const report = await db.query('SELECT * FROM reports WHERE id = $1', [id]);
  if (report.rows.length === 0) {
    throw new AppError('Report not found', 404);
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.title) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.data) {
    fields.push(`data = $${paramIndex++}`);
    values.push(JSON.stringify(updates.data));
  }

  if (fields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);
  const result = await db.query(
    `UPDATE reports SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

const deleteReport = async (id) => {
  const result = await db.query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Report not found', 404);
  }
  return result.rows[0];
};

module.exports = { generateReport, getReports, getReportById, updateReport, deleteReport };
