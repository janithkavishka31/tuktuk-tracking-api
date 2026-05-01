function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};