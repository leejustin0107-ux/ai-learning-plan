export default function ErrorState({ message, onRetry }) {
  return (
    <div
      style={{
        padding: '1.5rem',
        background: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca',
      }}
    >
      <p style={{ margin: '0 0 0.5rem', color: '#991b1b' }}>
        ⚠️ {message || 'Something went wrong.'}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.25rem 0.75rem',
            background: '#fff',
            border: '1px solid #fca5a5',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      )}

      <p
        style={{
          margin: '0.5rem 0 0',
          fontSize: '0.8rem',
          color: '#9ca3af',
        }}
      >
        If the problem continues, please contact your facilitator.
      </p>
    </div>
  );
}