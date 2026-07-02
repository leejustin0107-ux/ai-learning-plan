require('dotenv').config();

process.env.LLM_PROVIDER = 'mock';
process.env.GEMINI_API_KEY = 'test-key';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');

let token;
let goalId;

const testEmail = `aiflow-test-${Date.now()}@test.com`;
const testPassword = 'test12345678';

function getCurrentWeekStart() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(today);
  monday.setDate(diff);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date = String(monday.getDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
}

function getFutureDate(daysFromToday = 21) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

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
      deadline: getFutureDate(30),
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
        week_start: getCurrentWeekStart(),
      });

    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);

    expect(res.body.tasks[0]).toHaveProperty('title');
    expect(res.body.tasks[0]).toHaveProperty('rationale');
    expect(res.body.tasks[0].duration_estimate).toBeGreaterThanOrEqual(25);
    expect(res.body.tasks[0].duration_estimate).toBeLessThanOrEqual(90);
  });

  test('suggest → accept → task appears in calendar', async () => {
    const weekStart = getCurrentWeekStart();
    const suggestRes = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal_id: goalId,
        week_start: getCurrentWeekStart(),
      });

    expect(suggestRes.status).toBe(200);

    const task = suggestRes.body.tasks[0];

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...task,
        goal_id: goalId,
        source: 'ai',
      });

    expect([200, 201]).toContain(createRes.status);

    const createdTask = createRes.body.task || createRes.body;

    expect(createdTask.source).toBe('ai');

    const calendarRes = await request(app)
      .get('/api/tasks')
      .query({ week_start: weekStart })
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
        week_start: getCurrentWeekStart(),
      });

    expect(res.status).toBe(404);
  });

  test('suggest without auth returns 401', async () => {
    const res = await request(app)
      .post('/api/ai/plan/suggest')
      .send({
        goal_id: goalId,
        week_start: getCurrentWeekStart(),
      });

    expect(res.status).toBe(401);
  });
});