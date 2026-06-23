require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  pointsPerDollar: parseInt(process.env.POINTS_PER_DOLLAR) || 1,
  pointsToDollar: parseInt(process.env.POINTS_TO_DOLLAR) || 100,
};
