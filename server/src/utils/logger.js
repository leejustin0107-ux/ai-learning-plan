// TODO: Implementasikan Pino structured logging.
// Lihat modul Setup — sub modul "Observability & AI Boundary".
const logger = {
  info: (obj) => console.log(JSON.stringify(obj)),
  warn: (obj) => console.warn(JSON.stringify(obj)),
  error: (obj) => console.error(JSON.stringify(obj)),
  debug: (obj) => console.debug(JSON.stringify(obj)),
};
module.exports = logger;
