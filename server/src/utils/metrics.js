// TODO: Implementasikan prom-client metrics.
// Lihat modul Setup — sub modul "Observability & AI Boundary".
const client = require('prom-client');
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpRequestCount = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});
const httpLatency = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request latency in ms',
  labelNames: ['method', 'route'],
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
  registers: [register],
});
const aiRequestCount = new client.Counter({
  name: 'ai_requests_total',
  help: 'Total AI API requests',
  labelNames: ['type', 'status'],
  registers: [register],
});
module.exports = { register, httpRequestCount, httpLatency, aiRequestCount };