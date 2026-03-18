// Global error handler — catches anything thrown in controllers
export const errorHandler = (err, req, res, next) => {
  console.error(`❌  ${req.method} ${req.originalUrl} →`, err.message)

  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

// 404 handler for unknown routes
export const notFound = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}
