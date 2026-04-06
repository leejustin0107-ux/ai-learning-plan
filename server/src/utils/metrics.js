// TODO: Implementasikan prom-client metrics.
// Lihat modul Setup — sub modul "Observability & AI Boundary".
module.exports = {
  register: { contentType: 'text/plain', metrics: async () => '# No metrics configured yet\n' },
  httpRequestCount: { inc: () => {} },
  httpLatency: { observe: () => {} },
  aiRequestCount: { inc: () => {} },
};
