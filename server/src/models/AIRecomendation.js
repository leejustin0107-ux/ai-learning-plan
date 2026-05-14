const db = require('../utils/db');

async function create({ user_id, type, input_context, output }) {
  const result = await db.query(
    `INSERT INTO ai_recommendations
     (user_id, type, input_context, output)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      user_id,
      type,
      JSON.stringify(input_context),
      JSON.stringify(output),
    ]
  );

  return result.rows[0];
}

module.exports = {
  create,
};