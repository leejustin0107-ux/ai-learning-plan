// TODO: Implementasikan JWT authentication middleware.
// Lihat modul Scaffolding — sub modul "Authentication & CRUD".
function authenticate(req, res, next) {
  res.status(401).json({ error: 'authenticate belum diimplementasikan' });
}
module.exports = authenticate;
