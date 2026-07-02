import { useState, useEffect } from 'react';
import { api, getCached, clearApiCache } from '../services/api';
import ErrorState from './ErrorState';
import { PageSkeleton } from './Skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react';


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
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchWeekTasks() {
    try {
      setLoading(true);
      setError(null);

      const data = await getCached(`/tasks?week_start=${weekStart}`, 5000);
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

  async function handleDropTask(e, newDate, newSlot) {
    e.preventDefault();
    e.stopPropagation();

    const taskId = e.dataTransfer.getData('text/plain');

    if (!taskId) return;

    try {
      await api.patch(`/tasks/${taskId}`, {
        planned_date: newDate,
        planned_slot: newSlot,
      });

      clearApiCache('/tasks');
      await fetchWeekTasks();
    } catch (err) {
      console.error(err);
      setError('Failed to move task. Please try again.');
    } finally {
      setDraggingTaskId(null);
      setDragOverSlot(null);
    }
  }

  function toDateString(dateValue) {
    if (!dateValue) return '';

    if (typeof dateValue === 'string') {
      return dateValue.slice(0, 10);
    }

    const date = new Date(dateValue);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  async function handleExportWeeklyCalendar() {
    try {
      const exportWeekStart = toDateString(weekStart);
      const token = localStorage.getItem('token')?.trim();

      const response = await fetch(
        `/api/export/weekly.ics?week_start=${exportWeekStart}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export weekly calendar');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `ai-learning-plan-${exportWeekStart}.ics`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('failed to export weekly calendar:', err);
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="weekly-calendar">
        <PageSkeleton type="calendar" />
      </div>
    );
  }

  return (
    <div className="weekly-calendar">
      <div className="calendar-header calendar-toolbar">
        <button
          type="button"
          className="week-nav-button"
          onClick={() => navigateWeek(-1)}
          aria-label="Go to previous week"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>

        <h3 className="calendar-week-title">Week of {weekStart}</h3>

        <div className="calendar-toolbar-actions">
          <button
            type="button"
            className="export-calendar-button"
            onClick={handleExportWeeklyCalendar}
          >
            Export Week to Calendar
          </button>

          <button
            type="button"
            className="week-nav-button"
            onClick={() => navigateWeek(1)}
            aria-label="Go to next week"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
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
                      } ${dragOverSlot === `${dateKey}-${slot}` ? 'drag-over' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSlot(`${dateKey}-${slot}`);
                      }}
                      onDragLeave={() => {
                        setDragOverSlot(null);
                      }}
                      onDrop={(e) => handleDropTask(e, dateKey, slot)}
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
                        {slotTasks.map((task) => {
                          const taskStatus = getTaskStatus(task);
                          const canDragTask = taskStatus !== 'finished';

                          return (
                            <button
                              key={task.id}
                              type="button"
                              draggable={canDragTask}
                              className={`calendar-task-card ${taskStatus} ${
                                draggingTaskId === task.id ? 'dragging' : ''
                              }`}
                              aria-label={`Open task "${task.title}", ${task.duration_estimate} minutes`}
                              title={canDragTask ? 'Drag task to reschedule' : 'Finished task'}
                              onDragStart={(e) => {
                                if (!canDragTask) return;

                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', String(task.id));
                                setDraggingTaskId(task.id);
                              }}
                              onDragEnd={() => {
                                setDraggingTaskId(null);
                                setDragOverSlot(null);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskClick?.(task);
                              }}
                            >
                              <span className="calendar-task-icon">
                                <Clock3 size={14} aria-hidden="true" />
                              </span>

                              <span className="calendar-task-content">
                                <span className="calendar-task-title">
                                  {task.title}
                                </span>

                                <span className="calendar-task-duration">
                                  {task.duration_estimate}m
                                </span>
                              </span>
                            </button>
                          );
                        })}
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