export default function EmptyState({ type, onAction }) {
  const messages = {
    goals: {
      title: 'No goals yet',
      description: 'Start by defining what you want to learn.',
      action: 'Create First Goal',
    },
    tasks: {
      title: 'No tasks yet',
      description: 'Ask AI to create a study plan, or add a task manually.',
      action: 'Suggest Plan',
    },
    calendar: {
      title: 'Calendar is empty',
      description: 'Scheduled tasks will appear here.',
      action: null,
    },
    progress: {
      title: 'No progress data yet',
      description: 'Create a goal, add tasks, and mark tasks as done to generate weekly progress.',
      action: 'Create your first goal',
    },

    progressWeek: {
      title: 'No tasks planned for this week',
      description: 'You have learning data, but this selected week does not have planned or completed tasks yet.',
      action: 'Plan tasks for this week',
    },
  };

  const msg = messages[type];

  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
      <h3 style={{ marginBottom: '0.5rem', color: '#334155' }}>
        {msg.title}
      </h3>

      <p style={{ marginBottom: '1rem' }}>
        {msg.description}
      </p>

      {msg.action && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {msg.action}
        </button>
      )}
    </div>
  );
}