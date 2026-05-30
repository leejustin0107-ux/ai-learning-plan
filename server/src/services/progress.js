const db = require('../utils/db');
const { getWeekString, getWeekStart, getWeekEnd } = require('../utils/week');
 
async function recalculateProgress(userId, date) {
  const week = getWeekString(date);
  const weekStart = getWeekStart(date);
  const weekEnd = getWeekEnd(date);
 
  const result = await db.query(
    `SELECT
      COALESCE(SUM(duration_estimate), 0) / 60.0 AS planned_hours,
      COALESCE(SUM(
        CASE WHEN status = 'done'
        THEN COALESCE(actual_duration, duration_estimate)
        ELSE 0 END
      ), 0) / 60.0 AS completed_hours
    FROM tasks
    WHERE goal_id IN (SELECT id FROM goals WHERE user_id = $1)
    AND planned_date BETWEEN $2 AND $3`,
    [userId, weekStart, weekEnd]
  );
 
  const { planned_hours, completed_hours } = result.rows[0];
  const completion_rate = planned_hours > 0
    ? Math.min(completed_hours / planned_hours, 1)
    : 0;
 
  const saved = await db.query(
    `INSERT INTO progress_snapshots
    (user_id, week, planned_hours, completed_hours, completion_rate)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, week)
    DO UPDATE SET
      planned_hours = $3,
      completed_hours = $4,
      completion_rate = $5
    RETURNING *`,
    [userId, week, planned_hours, completed_hours, completion_rate]
  );

  console.log('SAVED PROGRESS SNAPSHOT:', saved.rows[0]);
 
  return { week, planned_hours, completed_hours, completion_rate };
}
 
module.exports = { recalculateProgress };