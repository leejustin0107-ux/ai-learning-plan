export default function TaskItem({ task, onStatusChange }) {
  const statusColors = {
    todo: '#e2e8f0',
    in_progress: '#fef3c7',
    done: '#d1fae5',
    skipped: '#fee2e2',
  };
  return (
    <div className="task-item" style={{ borderLeft: `4px solid ${statusColors[task.status]}` }}>
      <div className="task-info">
        <h4>{task.title}</h4>
        <span className="task-meta">{task.duration_estimate} menit · {task.planned_slot}</span>
      </div>
      <div className="task-actions">
        {task.status === 'todo' && (
          <button onClick={() => onStatusChange(task.id, 'done')}>✅ Selesai</button>
        )}
      </div>
    </div>
  );
}