export default function RationaleDisplay({ rationale, task }) {
  if (!rationale) return null;

  const points = rationale
    .split(/[,;]/)
    .map((point) => point.trim())
    .filter((point) => point.length > 0);

  return (
    <div
      style={{
        background: '#eff6ff',
        borderRadius: '6px',
        padding: '0.75rem',
        marginTop: '0.5rem',
      }}
    >
      <p
        style={{
          margin: '0 0 0.25rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#1e40af',
        }}
      >
        Why this suggestion?
      </p>

      {points.length > 1 ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: '1.25rem',
            fontSize: '0.8rem',
            color: '#334155',
          }}
        >
          {points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: '0.8rem',
            color: '#334155',
          }}
        >
          {rationale}
        </p>
      )}

      {task && (
        <p
          style={{
            margin: '0.25rem 0 0',
            fontSize: '0.75rem',
            color: '#64748b',
          }}
        >
          {task.duration_estimate} minutes · {task.planned_slot} ·{' '}
          {task.planned_date}
        </p>
      )}
    </div>
  );
}