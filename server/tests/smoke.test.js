const request = require('supertest');
const app = require('../src/app');

describe('smoke tests', () => {
  test('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  test('GET /metrics returns metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
  });

  test('GET /api/auth/me requires auth', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/register route exists', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test-${Date.now()}@example.com`,
        password: 'securepass123',
      });

    expect(res.status).not.toBe(404);
  });

  test('POST /api/auth/login route exists', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'missing-user@example.com',
        password: 'wrongpass123',
      });

    expect(res.status).not.toBe(404);
  });
});