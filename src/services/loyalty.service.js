const db = require('../config/database');
const env = require('../config/env');

const getPoints = async (userId) => {
  const result = await db.query(
    'SELECT loyalty_points FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.loyalty_points || 0;
};

const getPointsHistory = async (userId) => {
  // Show recent orders where points were earned or used
  const result = await db.query(
    `SELECT id, points_earned, points_used, total_amount, status, created_at
     FROM orders
     WHERE user_id = $1 AND (points_earned > 0 OR points_used > 0)
     ORDER BY created_at DESC
     LIMIT 20`,
    [userId]
  );
  return result.rows;
};

const calculatePointsValue = (points) => {
  return parseFloat((points / env.pointsToDollar).toFixed(2));
};

module.exports = { getPoints, getPointsHistory, calculatePointsValue };
