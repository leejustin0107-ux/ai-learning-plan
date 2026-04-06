// TODO: Implementasikan rate limiting.
// Lihat modul Cycle 2 — sub modul "Security Implementation".
const aiLimiter = (req, res, next) => next();
const authLimiter = (req, res, next) => next();
module.exports = { aiLimiter, authLimiter };
