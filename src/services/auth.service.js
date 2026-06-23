const bcrypt = require('bcrypt');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

const register = async ({ name, email, password, phone }) => {
  // Check if email exists
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('Email already registered', 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.query(
    `INSERT INTO users (email, password_hash, name, phone, role)
     VALUES ($1, $2, $3, $4, 'customer')
     RETURNING id, email, name, phone, role, loyalty_points, created_at`,
    [email, passwordHash, name, phone || null]
  );

  const user = result.rows[0];
  const token = generateToken(user);

  return { user, token };
};

const login = async ({ email, password }) => {
  const result = await db.query(
    'SELECT id, email, password_hash, name, role, loyalty_points FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const { password_hash, ...userData } = user;
  const token = generateToken(userData);

  return { user: userData, token };
};

module.exports = { register, login };
