exports.up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_tasks_active
    ON tasks(planned_date)
    WHERE status IN ('todo', 'in_progress')
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_created_at
    ON ai_recommendations(user_id, created_at)
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS idx_tasks_active');
  pgm.sql('DROP INDEX IF EXISTS idx_ai_recommendations_user_created_at');
};