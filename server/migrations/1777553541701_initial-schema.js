/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Users & Profiles
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
 
 
  pgm.createTable('profiles', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users', onDelete: 'CASCADE' },
    timezone: { type: 'varchar(50)', default: 'Asia/Jakarta' },
    preferred_time: { type: 'varchar(20)', default: 'morning' },
    weekly_target_hours: { type: 'numeric(4,1)', default: 5.0 },
    availability: { type: 'jsonb', default: '{}' },
  });
 
 
  // Goals & Tasks
  pgm.createTable('goals', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users', onDelete: 'CASCADE' },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    deadline: { type: 'date' },
    status: { type: 'varchar(20)', default: 'active' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
 
 
  pgm.createTable('tasks', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    goal_id: { type: 'uuid', references: 'goals', onDelete: 'CASCADE' },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    duration_estimate: { type: 'integer', notNull: true, check: 'duration_estimate BETWEEN 25 AND 90' },
    planned_date: { type: 'date' },
    planned_slot: { type: 'varchar(20)' },
    status: { type: 'varchar(20)', default: 'todo' },
    source: { type: 'varchar(10)', default: 'manual' },
    actual_duration: { type: 'integer' },
    completed_at: { type: 'timestamptz' },
    rationale: { type: 'text' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
 
 
  // AI & Progress
  pgm.createTable('ai_recommendations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users', onDelete: 'CASCADE' },
    type: { type: 'varchar(20)', notNull: true },
    input_context: { type: 'jsonb', notNull: true },
    output: { type: 'jsonb', notNull: true },
    status: { type: 'varchar(20)', default: 'pending' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
 
 
  pgm.createTable('progress_snapshots', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users', onDelete: 'CASCADE' },
    week: { type: 'varchar(8)', notNull: true },
    planned_hours: { type: 'numeric(5,1)', default: 0 },
    completed_hours: { type: 'numeric(5,1)', default: 0 },
    completion_rate: { type: 'numeric(3,2)', default: 0 },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
  pgm.addConstraint('progress_snapshots', 'unique_user_week', { unique: ['user_id', 'week'] });
 
 
  // Audit
  pgm.createTable('audit_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users' },
    action: { type: 'varchar(50)', notNull: true },
    recommendation_id: { type: 'uuid', references: 'ai_recommendations' },
    metadata: { type: 'jsonb', default: '{}' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
 
 
  // Index untuk query yang sering digunakan
  pgm.createIndex('tasks', 'goal_id');
  pgm.createIndex('tasks', 'planned_date');
  pgm.createIndex('tasks', 'status');
  pgm.createIndex('progress_snapshots', ['user_id', 'week']);
  pgm.createIndex('audit_logs', 'user_id');
};


/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('audit_logs');
  pgm.dropTable('progress_snapshots');
  pgm.dropTable('ai_recommendations');
  pgm.dropTable('tasks');
  pgm.dropTable('goals');
  pgm.dropTable('profiles');
  pgm.dropTable('users');
};
