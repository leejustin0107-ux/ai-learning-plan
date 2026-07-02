require('dotenv').config();

process.env.LLM_PROVIDER = 'mock';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/utils/db');

let token;

function getId(body, key) {
  return body?.id || body?.[key]?.id;
}

function getFutureDate(daysFromToday = 7) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

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

beforeAll(async () => {
  await db.query(
    "DELETE FROM users WHERE email IN ('edge-test@test.com', 'edge-other@test.com')"
  );

  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'edge-test@test.com',
      password: 'test12345678',
    });

  token = res.body.token;
});

afterAll(async () => {
  await db.query(
    "DELETE FROM users WHERE email IN ('edge-test@test.com', 'edge-other@test.com')"
  );

  if (db.pool && typeof db.pool.end === 'function') {
    await db.pool.end();
  }
});

describe('Edge Cases', () => {
  test('suggest with non-existing goal_id returns 404', async () => {
    const res = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal_id: '00000000-0000-0000-0000-000000000000',
        week_start: getCurrentWeekStart(),
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/goal/i);
  });

  test('suggest with invalid date format returns 400', async () => {
    const res = await request(app)
      .post('/api/ai/plan/suggest')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal_id: '00000000-0000-0000-0000-000000000000',
        week_start: 'not-a-date',
      });

    expect(res.status).toBe(400);
  });

  test('PATCH status with invalid transition returns 400', async () => {
    const goalRes = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Edge Test Goal',
        description: 'Goal for edge case testing',
        deadline: getFutureDate(14),
      });

    const goalId = getId(goalRes.body, 'goal');

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal_id: goalId,
        title: 'Edge Test Task',
        description: 'Task for invalid status transition test',
        duration_estimate: 30,
        planned_date: getFutureDate(7),
        planned_slot: 'morning',
      });

    const taskId = getId(taskRes.body, 'task');

    await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'todo' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transition|not allowed|tidak diperbolehkan/i);
  });

  test('goals owned by another user cannot be modified', async () => {
    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'edge-other@test.com',
        password: 'test12345678',
      });

    const user2GoalRes = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${user2Res.body.token}`)
      .send({
        title: 'User 2 Goal',
        description: 'Private goal',
        deadline: getFutureDate(21),
      });

    const user2GoalId = getId(user2GoalRes.body, 'goal');

    const res = await request(app)
      .patch(`/api/goals/${user2GoalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Hijacked Goal',
      });

    expect(res.status).toBe(404);
  });

  test('accepting the same AI task twice with the same idempotency key does not duplicate task', async () => {
    const goalRes = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Idempotency Test Goal',
        description: 'Goal for testing duplicate AI task accept',
        deadline: getFutureDate(14),
      });

    const goalId = goalRes.body.id || goalRes.body.goal?.id;

    const idempotencyKey = `ai-task-test-${Date.now()}`;

    const payload = {
      goal_id: goalId,
      title: 'Idempotent AI Task',
      description: 'This task should only be created once.',
      duration_estimate: 30,
      planned_date: getFutureDate(7),
      planned_slot: 'morning',
      source: 'ai',
      rationale: 'Suggested by AI for testing.',
      idempotency_key: idempotencyKey,
    };

    const firstRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    const secondRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(firstRes.status).toBe(201);
    expect(secondRes.status).toBe(200);
    expect(secondRes.body.idempotent).toBe(true);

    const check = await db.query(
      `SELECT COUNT(*)::int AS count
      FROM tasks
      WHERE goal_id = $1
      AND idempotency_key = $2`,
      [goalId, idempotencyKey]
    );

    expect(check.rows[0].count).toBe(1);
  });

  test('export without week_start returns 400', async () => {
    const res = await request(app)
      .get('/api/export/weekly')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  test('iCalendar export returns valid calendar content', async () => {
    const weekStart = getCurrentWeekStart();

    const res = await request(app)
      .get(`/api/export/weekly.ics?week_start=${weekStart}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/calendar/);
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.text).toContain('END:VCALENDAR');
  });
});