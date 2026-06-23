const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);

  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({ error: message });
  }

  res.status(status).render('error', {
    title: 'Error',
    message,
    status,
    layout: 'layouts/main',
    user: req.user || null,
  });
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
