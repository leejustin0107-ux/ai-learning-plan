// TODO: Implementasikan global error handler.
// Lihat modul Scaffolding — sub modul "AI Stub & Quality Foundation".
const logger = require('../utils/logger');
function errorHandler(err, req, res, next) {
  logger.error({
    request_id: req.requestId,
    error_type: err.name,
    error_message: err.message,
    route: req.originalUrl,
  });

  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Input tidak valid', details: err.errors });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Autentikasi diperlukan' });
  }

  res.status(500).json({ error: 'Terjadi kesalahan internal' });
}

module.exports = errorHandler;
