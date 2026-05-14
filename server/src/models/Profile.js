const db = require('../utils/db');

async function findByUserId(userId) {
  const result = await db.query(
    `SELECT user_id, timezone, preferred_time, weekly_target_hours, availability
    FROM profiles
    WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0];
}

module.exports = {
  findByUserId,
};