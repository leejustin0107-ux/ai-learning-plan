exports.up = (pgm) => {
  pgm.addColumn('tasks', {
    idempotency_key: {
      type: 'text',
      notNull: false,
    },
  });

  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_goal_idempotency_key
    ON tasks(goal_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS idx_tasks_goal_idempotency_key');
  pgm.dropColumn('tasks', 'idempotency_key');
};
