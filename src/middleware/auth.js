const { verifyToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  // Check cookie first, then Authorization header
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/login');
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.clearCookie('token');
    return res.redirect('/login');
  }
};

// Optional auth - sets req.user if token exists but doesn't block
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      req.user = verifyToken(token);
    } catch (err) {
      // Token invalid, continue without user
    }
  }
  next();
};

module.exports = { authenticate, optionalAuth };
