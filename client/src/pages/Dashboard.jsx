import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { PageSkeleton } from '../components/Skeleton';
import '../styles/dashboard.css';

function formatLocalDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  d.setDate(diff);

  return formatLocalDate(d);
}

function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);

  return formatLocalDate(d);
}

function getWeekString(date = new Date()) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getDateOnly(dateValue) {
  if (!dateValue) return '';

  if (typeof dateValue === 'string') {
    return dateValue.split('T')[0];
  }

  return formatLocalDate(dateValue);
}

function isBetweenDates(dateValue, start, end) {
  const dateOnly = getDateOnly(dateValue);

  return dateOnly >= start && dateOnly <= end;
}

function isFinishedTask(task) {
  const normalizedStatus = String(task.status || '').toLowerCase();

  return (
    normalizedStatus === 'done' ||
    normalizedStatus === 'finished' ||
    normalizedStatus === 'completed'
  );
}

function getTaskStatus(task) {
  if (isFinishedTask(task)) {
    return 'finished';
  }

  const now = new Date();
  const today = formatLocalDate(now);

  const plannedDate = getDateOnly(task.planned_date);

  if (!plannedDate) {
    return 'ongoing';
  }

  if (plannedDate < today) {
    return 'overdue';
  }

  if (plannedDate === today) {
    const currentHour = now.getHours();

    if (task.planned_slot === 'morning' && currentHour >= 12) {
      return 'overdue';
    }

    if (task.planned_slot === 'afternoon' && currentHour >= 18) {
      return 'overdue';
    }
  }

  return 'ongoing';
}

function getSlotOrder(slot) {
  const slotOrder = {
    morning: 1,
    afternoon: 2,
    evening: 3,
  };

  return slotOrder[slot] || 99;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [goals, setGoals] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [progress, setProgress] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const weekStart = getMonday();
  const weekEnd = getWeekEnd(weekStart);
  const currentWeek = getWeekString();

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const goalsData = await api.get('/goals');

      const goalsArray = Array.isArray(goalsData)
        ? goalsData
        : goalsData.goals || [];

      const taskResults = await Promise.all(
        goalsArray.map(async (goal) => {
          const taskData = await api.get(`/goals/${goal.id}/tasks`);

          if (Array.isArray(taskData)) {
            return taskData;
          }

          if (Array.isArray(taskData.tasks)) {
            return taskData.tasks;
          }

          return [];
        })
      );

      const flattenedTasks = taskResults.flat();

      const progressData = await api.get(`/progress/weekly?week=${currentWeek}`);

      setGoals(goalsArray);
      setAllTasks(flattenedTasks);
      setProgress(progressData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, [location.key]);

  const plannedHours = Number(progress?.planned_hours || 0);
  const completedHours = Number(progress?.completed_hours || 0);
  const completionRate = Number(progress?.completion_rate || 0);
  const completionPercent = Math.round(completionRate * 100);

  const tasksThisWeek = allTasks.filter((task) =>
    isBetweenDates(task.planned_date, weekStart, weekEnd)
  );

  const finishedTasks = allTasks.filter((task) => isFinishedTask(task));

  const overdueTasks = allTasks.filter((task) => {
    if (!task?.id) return false;
    if (isFinishedTask(task)) return false;

    return getTaskStatus(task) === 'overdue';
  });

  const upcomingTasks = allTasks
    .filter((task) => getTaskStatus(task) === 'ongoing')
    .sort((a, b) => {
      const dateA = getDateOnly(a.planned_date);
      const dateB = getDateOnly(b.planned_date);

      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      return getSlotOrder(a.planned_slot) - getSlotOrder(b.planned_slot);
    })
    .slice(0, 5);

  const hasDashboardData = goals.length > 0 || allTasks.length > 0;

  if (loading) {
    return (
      <div className="dashboard-page">
        <PageSkeleton type="cards" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your learning goals, weekly tasks, and progress.</p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            onClick={() => navigate('/goals')}
            aria-label="Go to goals page to create or manage goals"
          >
            Manage Goals
          </button>

          <button
            type="button"
            onClick={() => navigate('/calendar')}
            aria-label="Go to weekly calendar page"
          >
            Open Calendar
          </button>
        </div>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={fetchDashboardData} />
      ) : !hasDashboardData ? (
        <EmptyState type="goals" onAction={() => navigate('/goals')} />
      ) : (
        <>
          <section className="dashboard-summary-grid">
            <article className="dashboard-card">
              <span className="dashboard-card-label">Total Goals</span>
              <strong>{goals.length}</strong>
            </article>

            <article className="dashboard-card">
              <span className="dashboard-card-label">Tasks This Week</span>
              <strong>{tasksThisWeek.length}</strong>
            </article>

            <article className="dashboard-card">
              <span className="dashboard-card-label">Finished Tasks</span>
              <strong>{finishedTasks.length}</strong>
            </article>

            <article className="dashboard-card warning">
              <span className="dashboard-card-label">Overdue Tasks</span>
              <strong>{overdueTasks.length}</strong>
            </article>
          </section>

          <section className="dashboard-progress-card">
            <div className="dashboard-progress-header">
              <div>
                <h2>This Week Progress</h2>
                <p>
                  {currentWeek} · {weekStart} to {weekEnd}
                </p>
              </div>

              <span className="dashboard-progress-percent">
                {completionPercent}%
              </span>
            </div>

            <div className="dashboard-progress-bar">
              <div
                className="dashboard-progress-fill"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <div className="dashboard-progress-details">
              <span>{completedHours.toFixed(1)}h completed</span>
              <span>{plannedHours.toFixed(1)}h planned</span>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h2>Upcoming Tasks</h2>

              <button
                type="button"
                onClick={() => navigate('/calendar')}
                aria-label="View all tasks in calendar"
              >
                View Calendar
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <EmptyState type="calendar" />
            ) : (
              <ul className="dashboard-task-list">
                {upcomingTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`dashboard-task-item ${getTaskStatus(task)}`}
                  >
                    <div>
                      <h3>{task.title}</h3>
                      <p>
                        {getDateOnly(task.planned_date)} · {task.planned_slot} ·{' '}
                        {task.duration_estimate} minutes
                      </p>
                    </div>

                    <span className="dashboard-task-status">
                      {getTaskStatus(task)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {overdueTasks.length > 0 && (
            <section className="dashboard-section overdue-section">
              <div className="dashboard-section-header">
                <h2>Needs Attention</h2>

                <button
                  type="button"
                  onClick={() => navigate('/calendar')}
                  aria-label="Open calendar to reschedule overdue tasks"
                >
                  Reschedule
                </button>
              </div>

              <ul className="dashboard-task-list">
                {overdueTasks.slice(0, 3).map((task) => (
                  <li
                    key={task.id}
                    className="dashboard-task-item overdue"
                  >
                    <div>
                      <h3>{task.title}</h3>
                      <p>
                        Overdue from {getDateOnly(task.planned_date)} ·{' '}
                        {task.planned_slot}
                      </p>
                    </div>

                    <span className="dashboard-task-status">overdue</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}