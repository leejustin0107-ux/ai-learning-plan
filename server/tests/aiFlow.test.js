require('dotenv').config();

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');

process.env.LLM_PROVIDER = 'mock';
process.env.GEMINI_API_KEY = 'test-key';

let token;
let goalId;

const testEmail = `aiflow-test-${Date.now()}@test.com`;
const testPassword = 'test12345678';

beforeAll(async () => {
  // Register test user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: testEmail,
      password: testPassword,
    });

  expect(registerRes.status).toBe(201);
  expect(registerRes.body).toHaveProperty('token');

  token = registerRes.body.token;

  // Create test goal
  const goalRes = await request(app)
    .post('/api/goals')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Goal for AI',
      description: 'Goal used for AI flow integration test',
      deadline: '2026-05-01',
    });

  expect([200, 201]).toContain(goalRes.status);

  // Adjust this depending on your backend response shape
  goalId = goalRes.body.id || goalRes.body.goal?.id;

  expect(goalId).toBeTruthy();
});

afterAll(async () => {
  await db.query(
    `DELETE FROM users
     WHERE email = $1`,
    [testEmail]
  );

  // Important:
  // Only keep this if this is your only database integration test.
  // If progress.test.js also calls db.pool.end(), only one file should close the pool.
  if (db.pool && typeof db.pool.end === 'function') {
    await db.pool.end();
  }
});

describe('AI Suggestion Flow', () => {
  test('suggest returns valid tasks', async () => {
    const res = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal_id: goalId,
        week_start: '2026-04-13',
      });

    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);

    expect(res.body.tasks[0]).toHaveProperty('title');
    expect(res.body.tasks[0]).toHaveProperty('rationale');
    expect(res.body.tasks[0].duration_estimate).toBeGreaterThanOrEqual(25);
    expect(res.body.tasks[0].duration_estimate).toBeLessThanOrEqual(90);
  });

  test('suggest → accept → task appears in calendar', async () => {
    // 1. Request suggestion
    const suggestRes = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal_id: goalId,
        week_start: '2026-04-13',
      });

    expect(suggestRes.status).toBe(200);

    const task = suggestRes.body.tasks[0];

    // 2. Accept task by creating it
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...task,
        goal_id: goalId,
        source: 'ai',
      });

    expect([200, 201]).toContain(createRes.status);

    // Adjust depending on your backend response shape
    const createdTask = createRes.body.task || createRes.body;

    expect(createdTask.source).toBe('ai');

    // 3. Verify task appears in calendar
    const calendarRes = await request(app)
      .get('/api/tasks?week_start=2026-04-13')
      .set('Authorization', `Bearer ${token}`);

    expect(calendarRes.status).toBe(200);

    const allTasks = Object.values(calendarRes.body.tasks).flat();

    expect(allTasks.some((calendarTask) => calendarTask.title === task.title)).toBe(true);
  });

  test('suggest with missing goal returns 404', async () => {
    const res = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal_id: '00000000-0000-0000-0000-000000000000',
        week_start: '2026-04-13',
      });

    expect(res.status).toBe(404);
  });

  test('suggest without auth returns 401', async () => {
    const res = await request(app)
      .post('/api/ai/plan/suggest')
      .send({
        goal_id: goalId,
        week_start: '2026-04-13',
      });

    expect(res.status).toBe(401);
  });
});