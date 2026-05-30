const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
 
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 20,
  message: {
    error: 'Batas permintaan AI tercapai. Coba lagi dalam 1 menit.',
  },
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res, _next, options) => {
    logger.warn({
      action: 'rate_limit_hit',
      route: req.originalUrl,
      user_id: req.user?.id,
    });
    res.status(429).json(options.message);
  },
});
 
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Terlalu banyak percobaan. Coba lagi nanti.' },
});
 
module.exports = { aiLimiter, authLimiter };
