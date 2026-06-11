import { useState, useEffect } from 'react';
import { api } from '../services/api';
import ErrorState from './ErrorState';
import { PageSkeleton } from './Skeleton';


const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['morning', 'afternoon', 'evening'];

const SLOT_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};


function getMonday(dateStr) {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();

  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  d.setDate(diff);

  return formatLocalDate(d);
}

function getTaskStatus(task) {
    if (task.status === 'done' || task.status === 'finished') {
      return 'finished';
    }

    const taskDate = getTaskDateString(task);

    if (!taskDate) {
      return 'ongoing';
    }

    const today = formatLocalDate(new Date());

    if (taskDate < today) {
      return 'overdue';
    }

    if (taskDate > today) {
      return 'ongoing';
    }

    const currentHour = new Date().getHours();

    const slotEndHour = {
      morning: 12,
      afternoon: 17,
      evening: 24,
    };

    const taskSlotEndHour = slotEndHour[task.planned_slot];

    if (taskSlotEndHour && currentHour >= taskSlotEndHour) {
      return 'overdue';
    }

    return 'ongoing';
  }

  function formatLocalDate(date) {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function getTaskDateString(task) {
    if (!task.planned_date) return null;

    if (
      typeof task.planned_date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(task.planned_date)
    ) {
      return task.planned_date;
    }
    return formatLocalDate(task.planned_date);
  }

export default function WeeklyCalendar({ refreshKey, onTaskClick, onSlotClick }) {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [tasksByDay, setTasksByDay] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchWeekTasks() {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get(`/tasks?week_start=${weekStart}`);
      setTasksByDay(data.tasks || {});
    } catch (err) {
      console.error('Failed to fetch weekly tasks:', err);
      setError(err.message);
      setTasksByDay({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeekTasks();
  }, [weekStart, refreshKey]);

  function navigateWeek(offset) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + offset * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  function getDateForDay(dayIndex) {
    const date = new Date(`${weekStart}T00:00:00`);
    date.setDate(date.getDate() + dayIndex);
    return formatLocalDate(date);
  }

  const hasTasks = Object.values(tasksByDay).some((tasks) => tasks.length > 0);

  if (loading) {
    return (
      <div className="weekly-calendar">
        <PageSkeleton type="calendar" />
      </div>
    );
  }

  return (
    <div className="weekly-calendar">
      <div className="calendar-header">
        <button
          type="button"
          onClick={() => navigateWeek(-1)}
          aria-label="Go to previous week"
        >
          ←
        </button>

        <h3>Week of {weekStart}</h3>

        <button
          type="button"
          onClick={() => navigateWeek(1)}
          aria-label="Go to next week"
        >
          →
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchWeekTasks} />
      ) : null}

      {!error && (
        <div className="calendar-grid">
          {DAYS.map((day, dayIndex) => {
            const dateKey = getDateForDay(dayIndex);
            const dayTasks = tasksByDay[dateKey] || [];

            return (
              <div key={day} className="day-column">
                <div className="day-header">
                  <strong>{day}</strong>
                  <small>{dateKey}</small>
                </div>

                {SLOTS.map((slot) => {
                  const slotTasks = dayTasks.filter(
                    (task) => task.planned_slot === slot
                  );

                  const isEmptySlot = slotTasks.length === 0;

                  return (
                    <div
                      key={slot}
                      role={isEmptySlot ? 'button' : undefined}
                      tabIndex={isEmptySlot ? 0 : undefined}
                      aria-label={
                        isEmptySlot
                          ? `${SLOT_LABELS[slot]} ${day} ${dateKey}, empty slot`
                          : `${SLOT_LABELS[slot]} ${day} ${dateKey}, ${slotTasks.length} tasks`
                      }
                      className={`time-slot ${
                        slotTasks.length ? 'has-tasks' : 'empty'
                      }`}
                      onKeyDown={(e) => {
                        if (
                          isEmptySlot &&
                          (e.key === 'Enter' || e.key === ' ')
                        ) {
                          e.preventDefault();
                          onSlotClick?.(dateKey, slot);
                        }
                      }}
                      onClick={() => {
                        if (isEmptySlot) {
                          onSlotClick?.(dateKey, slot);
                        }
                      }}
                    >
                      <span className="slot-label">{SLOT_LABELS[slot]}</span>

                      <div className="slot-task-list">
                        {slotTasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            className={`calendar-task-card ${getTaskStatus(task)}`}
                            aria-label={`Open task "${task.title}", ${task.duration_estimate} minutes`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskClick?.(task);
                            }}
                          >
                            <span className="calendar-task-title">
                              {task.title}
                            </span>

                            <span className="calendar-task-duration">
                              {task.duration_estimate}m
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};