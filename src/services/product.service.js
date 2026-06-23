const db = require('../config/database');

const getProducts = async ({ search, category_id, min_price, max_price, page = 1, limit = 12 }) => {
  const offset = (page - 1) * limit;
  let conditions = ['p.is_active = true'];
  let params = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (category_id) {
    conditions.push(`p.category_id = $${paramIndex}`);
    params.push(category_id);
    paramIndex++;
  }

  if (min_price) {
    conditions.push(`pv_agg.min_price >= $${paramIndex}`);
    params.push(min_price);
    paramIndex++;
  }

  if (max_price) {
    conditions.push(`pv_agg.min_price <= $${paramIndex}`);
    params.push(max_price);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countQuery = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM products p
    LEFT JOIN (
      SELECT product_id, MIN(price) as min_price
      FROM product_variants
      GROUP BY product_id
    ) pv_agg ON p.id = pv_agg.product_id
    ${whereClause}
  `;

  const dataQuery = `
    SELECT p.id, p.name, p.description, p.image_url, p.category_id,
           c.name as category_name,
           pv_agg.min_price, pv_agg.max_price, pv_agg.total_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN (
      SELECT product_id,
             MIN(price) as min_price,
             MAX(price) as max_price,
             SUM(stock_quantity) as total_stock
      FROM product_variants
      GROUP BY product_id
    ) pv_agg ON p.id = pv_agg.product_id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const [countResult, dataResult] = await Promise.all([
    db.query(countQuery, params.slice(0, -2)),
    db.query(dataQuery, params),
  ]);

  return {
    products: dataResult.rows,
    total: parseInt(countResult.rows[0].total),
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(countResult.rows[0].total / limit),
  };
};

const getProductById = async (id) => {
  const productResult = await db.query(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1 AND p.is_active = true`,
    [id]
  );

  if (productResult.rows.length === 0) return null;

  const variantsResult = await db.query(
    'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY price ASC',
    [id]
  );

  return {
    ...productResult.rows[0],
    variants: variantsResult.rows,
  };
};

const getCategories = async () => {
  const result = await db.query('SELECT * FROM categories ORDER BY name');
  return result.rows;
};

module.exports = { getProducts, getProductById, getCategories };
