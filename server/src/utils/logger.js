// TODO: Implementasikan Pino structured logging.
// Lihat modul Setup — sub modul "Observability & AI Boundary".
const pino = require('pino');
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
  },
});
module.exports = logger;
