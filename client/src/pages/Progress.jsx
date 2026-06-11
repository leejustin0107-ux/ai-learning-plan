import { useEffect, useState } from 'react';
import { api } from '../services/api';
import '../styles/progress.css'
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { PageSkeleton } from '../components/Skeleton';

function getWeekString(date = new Date()) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export default function Progress() {
  const [week, setWeek] = useState(getWeekString());
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function changeWeek(week, offset) {
    const [yearPart, weekPart] = week.split('-W');
    const year = Number(yearPart);
    const weekNumber = Number(weekPart);

    let newWeek = weekNumber + offset;
    let newYear = year;

    if (newWeek < 1) {
      newWeek = 52;
      newYear -= 1;
    }

    if (newWeek > 52) {
      newWeek = 1;
      newYear += 1;
    }

    return `${newYear}-W${String(newWeek).padStart(2, '0')}`;
  }

  function getProgressMessage(percent) {
    if (percent >= 100) return 'Excellent! You completed your weekly plan.';
    if (percent >= 70) return 'Great progress. You are close to completing the week.';
    if (percent >= 40) return 'Good start. Keep going with your remaining tasks.';
    if (percent > 0) return 'You have started. Try completing more tasks this week.';
    return 'No completed tasks yet for this week.';
  }

  async function fetchProgress() {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get(`/progress/weekly?week=${week}`);
      setProgress(data);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProgress();
  }, [week]);

  if (loading) {
    return (
      <div className="progress-page">
        <PageSkeleton type="cards" />
      </div>
    );
  }

  const plannedHours = Number(progress?.planned_hours || 0);
  const completedHours = Number(progress?.completed_hours || 0);
  const completionRate = Number(progress?.completion_rate || 0);
  const completionPercent = Math.round(completionRate * 100);

  const hasProgressData = plannedHours > 0 || completedHours > 0;

  return (
    <div className="progress-page">
      <h1>Progress</h1>
      <p>Weekly learning progress summary.</p>

      <div className="progress-week-controls">
        <button type="button" onClick={() => setWeek(changeWeek(week, -1))}>
          ←
        </button>

        <input
          value={week}
          onChange={(e) => setWeek(e.target.value.toUpperCase())}
          placeholder="2026-W22"
        />

        <button type="button" onClick={() => setWeek(changeWeek(week, 1))}>
          →
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchProgress} />
      ) : !hasProgressData ? (
        <EmptyState type="progress" />
      ) : (
        <div className="progress-dashboard">
          <div className="progress-summary-card">
            <span className="progress-label">Planned Hours</span>
            <strong>{plannedHours.toFixed(1)}h</strong>
          </div>

          <div className="progress-summary-card">
            <span className="progress-label">Completed Hours</span>
            <strong>{completedHours.toFixed(1)}h</strong>
          </div>

          <div className="progress-summary-card">
            <span className="progress-label">Completion Rate</span>
            <strong>{completionPercent}%</strong>
          </div>

          <div className="progress-main-card">
            <div className="progress-main-header">
              <div>
                <h2>{progress.week}</h2>
                <p>{getProgressMessage(completionPercent)}</p>
              </div>

              <span className="progress-percent">{completionPercent}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <div className="progress-detail-row">
              <span>{completedHours.toFixed(1)}h completed</span>
              <span>{plannedHours.toFixed(1)}h planned</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}