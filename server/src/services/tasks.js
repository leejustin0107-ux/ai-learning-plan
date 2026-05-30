const db = require('../utils/db');

function formatLocalDate(date) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

async function findOverdueTasks(userId) {
  const today = formatLocalDate(new Date());

  const result = await db.query(
    `SELECT t.*
     FROM tasks t
     JOIN goals g ON t.goal_id = g.id
     WHERE g.user_id = $1
     AND t.planned_date < $2
     AND t.status = 'todo'
     ORDER BY t.planned_date ASC`,
    [userId, today]
  );

  return result.rows;
}

async function findTasksByWeek(userId, weekStart) {
  const weekEnd = new Date(`${weekStart}T00:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekEndString = formatLocalDate(weekEnd);

  const result = await db.query(
    `SELECT t.*
     FROM tasks t
     JOIN goals g ON t.goal_id = g.id
     WHERE g.user_id = $1
     AND t.planned_date BETWEEN $2 AND $3
     ORDER BY t.planned_date, t.planned_slot`,
    [userId, weekStart, weekEndString]
  );

  return result.rows;
}

async function findTasksByIds(userId, taskIds) {
  if (!taskIds.length) return [];

  const placeholders = taskIds.map((_, i) => `$${i + 2}`).join(',');

  const result = await db.query(
    `SELECT t.*
     FROM tasks t
     JOIN goals g ON t.goal_id = g.id
     WHERE g.user_id = $1
     AND t.id IN (${placeholders})`,
    [userId, ...taskIds]
  );

  return result.rows;
}

module.exports = {
  findOverdueTasks,
  findTasksByWeek,
  findTasksByIds,
};