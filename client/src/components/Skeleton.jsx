import '../styles/skeleton.css';

export function PageSkeleton({ type = 'cards' }) {
  if (type === 'calendar') {
    return (
      <div className="skeleton-page" aria-label="Loading calendar">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-calendar-grid">
          {Array.from({ length: 7 }).map((_, dayIndex) => (
            <div className="skeleton-calendar-column" key={dayIndex}>
              <div className="skeleton-line skeleton-day-title" />
              {Array.from({ length: 3 }).map((__, slotIndex) => (
                <div className="skeleton-slot" key={slotIndex}>
                  <div className="skeleton-line skeleton-small" />
                  <div className="skeleton-line skeleton-task" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="skeleton-page" aria-label="Loading profile">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-card">
          <div className="skeleton-profile-header">
            <div className="skeleton-avatar" />
            <div>
              <div className="skeleton-line skeleton-medium" />
              <div className="skeleton-line skeleton-small" />
            </div>
          </div>

          <div className="skeleton-info-grid">
            <div className="skeleton-info-box" />
            <div className="skeleton-info-box" />
            <div className="skeleton-info-box" />
          </div>
        </div>

        <div className="skeleton-card">
          <div className="skeleton-line skeleton-medium" />
          <div className="skeleton-info-grid">
            <div className="skeleton-info-box" />
            <div className="skeleton-info-box" />
            <div className="skeleton-info-box" />
            <div className="skeleton-info-box" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-page" aria-label="Loading content">
      <div className="skeleton-line skeleton-title" />

      <div className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>

      <div className="skeleton-card skeleton-large-card">
        <div className="skeleton-line skeleton-medium" />
        <div className="skeleton-line skeleton-small" />
        <div className="skeleton-line skeleton-small" />
      </div>
    </div>
  );
}