const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const getProfile = async (userId) => {
  const result = await db.query(
    'SELECT id, email, name, phone, address, role, loyalty_points, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  return result.rows[0];
};

const updateProfile = async (userId, { name, phone, address }) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(phone);
  }
  if (address !== undefined) {
    fields.push(`address = $${paramIndex++}`);
    values.push(address);
  }

  if (fields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(userId);

  const result = await db.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, email, name, phone, address, role, loyalty_points`,
    values
  );

  return result.rows[0];
};

module.exports = { getProfile, updateProfile };
