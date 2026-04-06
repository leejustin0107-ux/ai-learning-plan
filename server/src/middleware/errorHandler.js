// TODO: Implementasikan global error handler.
// Lihat modul Scaffolding — sub modul "AI Stub & Quality Foundation".
function errorHandler(err, req, res, _next) {
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan internal' });
}
module.exports = errorHandler;
