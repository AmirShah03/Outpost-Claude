const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const getCart = async (userId) => {
  const result = await db.query(
    `SELECT ci.id, ci.quantity, ci.variant_id,
            pv.size, pv.price, pv.stock_quantity,
            p.id as product_id, p.name as product_name, p.image_url
     FROM cart_items ci
     JOIN product_variants pv ON ci.variant_id = pv.id
     JOIN products p ON pv.product_id = p.id
     WHERE ci.user_id = $1
     ORDER BY ci.created_at DESC`,
    [userId]
  );

  const items = result.rows;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, total: parseFloat(total.toFixed(2)), itemCount };
};

const addToCart = async (userId, { variant_id, quantity }) => {
  // Check variant exists and has stock
  const variant = await db.query(
    'SELECT pv.*, p.name as product_name FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = $1',
    [variant_id]
  );

  if (variant.rows.length === 0) {
    throw new AppError('Product variant not found', 404);
  }

  if (variant.rows[0].stock_quantity < quantity) {
    throw new AppError('Insufficient stock', 400);
  }

  // Upsert: add to existing quantity or insert new
  const result = await db.query(
    `INSERT INTO cart_items (user_id, variant_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, variant_id)
     DO UPDATE SET quantity = cart_items.quantity + $3
     RETURNING *`,
    [userId, variant_id, quantity]
  );

  return result.rows[0];
};

const updateCartItem = async (userId, itemId, { quantity }) => {
  // Verify ownership
  const item = await db.query(
    'SELECT ci.*, pv.stock_quantity FROM cart_items ci JOIN product_variants pv ON ci.variant_id = pv.id WHERE ci.id = $1 AND ci.user_id = $2',
    [itemId, userId]
  );

  if (item.rows.length === 0) {
    throw new AppError('Cart item not found', 404);
  }

  if (quantity > item.rows[0].stock_quantity) {
    throw new AppError('Insufficient stock', 400);
  }

  const result = await db.query(
    'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
    [quantity, itemId]
  );

  return result.rows[0];
};

const removeCartItem = async (userId, itemId) => {
  const result = await db.query(
    'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
    [itemId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Cart item not found', 404);
  }

  return result.rows[0];
};

const clearCart = async (userId) => {
  await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
