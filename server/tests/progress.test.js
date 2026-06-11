require('dotenv').config();

const db = require('../src/utils/db');
const { recalculateProgress } = require('../src/services/progress');
const bcrypt = require('bcryptjs');

let userId;
let goalId;

const testDate = '2026-04-15';
const testEmail = `progress-test-${Date.now()}@test.com`;

beforeAll(async () => {
  const hash = await bcrypt.hash('test12345678', 10);

  const userResult = await db.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id`,
    [testEmail, hash]
  );

  userId = userResult.rows[0].id;

  await db.query(
    `INSERT INTO profiles (user_id)
     VALUES ($1)`,
    [userId]
  );

  const goalResult = await db.query(
    `INSERT INTO goals (user_id, title)
     VALUES ($1, $2)
     RETURNING id`,
    [userId, 'Test Goal']
  );

  goalId = goalResult.rows[0].id;
});

afterAll(async () => {
  await db.query(
    `DELETE FROM users
     WHERE id = $1`,
    [userId]
  );

  if (db.pool && typeof db.pool.end === 'function') {
    await db.pool.end();
  }
});

beforeEach(async () => {
  await db.query(
    `DELETE FROM tasks
     WHERE goal_id = $1`,
    [goalId]
  );

  await db.query(
    `DELETE FROM progress_snapshots
     WHERE user_id = $1`,
    [userId]
  );
});

describe('recalculateProgress', () => {
  test('calculates completion rate correctly', async () => {
    await db.query(
      `INSERT INTO tasks
       (goal_id, title, duration_estimate, planned_date, planned_slot, status, actual_duration)
       VALUES
       ($1, 'Task 1', 60, $2, 'morning', 'done', 45),
       ($1, 'Task 2', 30, $2, 'afternoon', 'done', NULL),
       ($1, 'Task 3', 60, $2, 'evening', 'todo', NULL)`,
      [goalId, testDate]
    );

    const result = await recalculateProgress(userId, testDate);

    expect(Number(result.planned_hours)).toBeCloseTo(2.5);
    expect(Number(result.completed_hours)).toBeCloseTo(1.25);
    expect(Number(result.completion_rate)).toBeCloseTo(0.5);
  });

  test('uses actual_duration when available and falls back to duration_estimate', async () => {
    await db.query(
      `INSERT INTO tasks
       (goal_id, title, duration_estimate, planned_date, planned_slot, status, actual_duration)
       VALUES
       ($1, 'Task 1', 60, $2, 'morning', 'done', 90),
       ($1, 'Task 2', 45, $2, 'afternoon', 'done', NULL)`,
      [goalId, testDate]
    );

    const result = await recalculateProgress(userId, testDate);

    expect(Number(result.completed_hours)).toBeCloseTo(2.25);
  });

  test('returns zero progress when there are no tasks', async () => {
    const result = await recalculateProgress(userId, testDate);

    expect(Number(result.planned_hours)).toBe(0);
    expect(Number(result.completed_hours)).toBe(0);
    expect(Number(result.completion_rate)).toBe(0);
  });

  test('completion_rate does not exceed 1.0', async () => {
    await db.query(
      `INSERT INTO tasks
       (goal_id, title, duration_estimate, planned_date, planned_slot, status, actual_duration)
       VALUES
       ($1, 'Task 1', 30, $2, 'morning', 'done', 60)`,
      [goalId, testDate]
    );

    const result = await recalculateProgress(userId, testDate);

    expect(Number(result.completion_rate)).toBeLessThanOrEqual(1);
  });
});