const db = require('../utils/db');

async function findByWeekForUser(userId, weekStart) {
  const result = await db.query(
    `SELECT t.id, t.title, t.planned_date, t.planned_slot, t.duration_estimate, t.status
     FROM tasks t
     JOIN goals g ON g.id = t.goal_id
     WHERE g.user_id = $1
       AND t.planned_date >= $2::date
       AND t.planned_date < ($2::date + INTERVAL '7 days')
     ORDER BY t.planned_date ASC`,
    [userId, weekStart]
  );

  return result.rows;
}

async function create(data) {
  const result = await db.query(
    `INSERT INTO tasks
     (goal_id, title, description, duration_estimate, planned_date, planned_slot, source, rationale, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'todo')
     RETURNING *`,
    [
      data.goal_id,
      data.title,
      data.description || null,
      data.duration_estimate,
      data.planned_date,
      data.planned_slot,
      data.source || 'manual',
      data.rationale || null,
    ]
  );

  return result.rows[0];
}

module.exports = {
  findByWeekForUser,
  create,
};