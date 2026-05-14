const db = require('../utils/db');

async function findByIdForUser(goalId, userId) {
  const result = await db.query(
    `SELECT id, user_id, title, description, deadline
    FROM goals
    WHERE id = $1 AND user_id = $2`,
    [goalId, userId]
  );

  return result.rows[0];
}

module.exports = {
  findByIdForUser,
};