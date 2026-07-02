import { useState } from 'react';
import { api } from '../services/api';
import WeeklyCalendar from '../components/WeeklyCalendar';
import useFocusTrap from '../hooks/useFocusTrap';
import '../styles/calendar.css';

export default function Calendar() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [rescheduleRecommendation, setRescheduleRecommendation] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const taskModalRef = useFocusTrap(Boolean(selectedTask), closeTaskPopup);

  function handleTaskClick(task) {
    setSelectedTask(task);
    setRescheduleRecommendation(null);
  }

  function closeTaskPopup() {
    setSelectedTask(null);
    setRescheduleRecommendation(null);
    setRescheduling(false);
  }

  function handleSlotClick(date, slot) {
    console.log('Clicked empty slot:', date, slot);
  }

  async function handleMarkTaskDone(taskId) {
    try {
      const data = await api.patch(`/tasks/${taskId}/status`);
      setSelectedTask(data.task);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('failed to mark task as done:', err);
      alert(err.message);
    }
  }

  async function handleDeleteTask(taskId) {
    const confirmed = window.confirm('Are you sure you want to delete this task?');

    if (!confirmed) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      setSelectedTask(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('failed to delete task:', err);
      alert(err.message);
    }
  }

  async function handleRescheduleTask(taskId) {
    try {
      setRescheduling(true);
      setRescheduleRecommendation(null);

      const data = await api.post('/ai/plan/reschedule', {
        task_ids: [taskId],
      });

      setRescheduleRecommendation(data.recommendation);
    } catch (err) {
      console.error('failed to reschedule task:', err);
      alert(err.message);
    } finally {
      setRescheduling(false);
    }
  }

  async function handleAcceptReschedule(option) {
    if (!selectedTask || !option) return;

    try {
      const data = await api.patch(`/tasks/${selectedTask.id}/schedule`, {
        planned_date: option.suggested_date,
        planned_slot: option.suggested_slot,
      });

      setSelectedTask(data.task);
      setRescheduleRecommendation(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('failed to accept reschedule:', err);
      alert(err.message);
    }
  }

  function handleDeclineReschedule() {
    setRescheduleRecommendation(null);
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

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }


  return (
    <div className="calendar-page">
      <h1>Weekly Calendar</h1>
      <p>View your planned tasks for the week.</p>

      <WeeklyCalendar
        refreshKey={refreshKey}
        onTaskClick={handleTaskClick}
        onSlotClick={handleSlotClick}
      />

      {selectedTask && (
        <div className="task-popup-overlay">
          <div
            ref={taskModalRef}
            className="task-popup calendar-task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-task-modal-title"
            tabIndex={-1}
          >
            <button
              type="button"
              className="task-popup-close"
              onClick={closeTaskPopup}
              aria-label="Close task details"
              title="Close"
            >
              ×
            </button>

            <div className="calendar-task-modal-header">
              <div>
                <span className={`calendar-task-status-pill ${getTaskStatus(selectedTask)}`}>
                  {getTaskStatus(selectedTask)}
                </span>

                <h2 id="calendar-task-modal-title">{selectedTask.title}</h2>

                <p>
                  {selectedTask.description || 'No description provided for this task.'}
                </p>
              </div>
            </div>

            <div className="calendar-task-detail-grid">
              <div className="calendar-task-detail-card">
                <span>Date</span>
                <strong>{formatDate(selectedTask.planned_date)}</strong>
              </div>

              <div className="calendar-task-detail-card">
                <span>Slot</span>
                <strong>{selectedTask.planned_slot || 'No slot'}</strong>
              </div>

              <div className="calendar-task-detail-card">
                <span>Duration</span>
                <strong>
                  {selectedTask.duration_estimate
                    ? `${selectedTask.duration_estimate} min`
                    : 'No duration'}
                </strong>
              </div>
            </div>

            <div className="calendar-task-modal-actions">
              {getTaskStatus(selectedTask) !== 'finished' && (
                <button
                  type="button"
                  className="calendar-modal-done-button"
                  onClick={() => handleMarkTaskDone(selectedTask.id)}
                >
                  Mark as Done
                </button>
              )}

              {getTaskStatus(selectedTask) === 'overdue' && (
                <button
                  type="button"
                  className="calendar-modal-reschedule-button"
                  onClick={() => handleRescheduleTask(selectedTask.id)}
                  disabled={rescheduling}
                >
                  {rescheduling ? 'Generating options...' : 'AI Reschedule'}
                </button>
              )}

              <button
                type="button"
                className="calendar-modal-delete-button"
                onClick={() => handleDeleteTask(selectedTask.id)}
              >
                Delete Task
              </button>
            </div>

            {rescheduling && (
              <div className="calendar-reschedule-panel">
                <div className="calendar-reschedule-header">
                  <div>
                    <h3>Generating AI reschedule options...</h3>
                    <p>Please wait while AI checks possible dates and slots.</p>
                  </div>
                </div>

                <div className="calendar-reschedule-skeleton">
                  <div />
                  <div />
                  <div />
                </div>
              </div>
            )}

            {rescheduleRecommendation?.options?.length > 0 && (
              <div className="calendar-reschedule-panel">
                <div className="calendar-reschedule-header">
                  <div>
                    <h3>AI Reschedule Options</h3>
                    <p>Choose one option to update this task schedule.</p>
                  </div>

                  <button
                    type="button"
                    className="calendar-reschedule-close-button"
                    onClick={handleDeclineReschedule}
                  >
                    Close
                  </button>
                </div>

                <div className="calendar-reschedule-option-list">
                  {rescheduleRecommendation.options.map((option, index) => (
                    <article
                      className="calendar-reschedule-option-card"
                      key={`${option.task_id}-${option.suggested_date}-${option.suggested_slot}-${index}`}
                    >
                      <div className="calendar-reschedule-option-top">
                        <span>Option {index + 1}</span>

                        <strong>
                          {option.suggested_date} · {option.suggested_slot}
                        </strong>
                      </div>

                      <ul className="calendar-reschedule-rationale-list">
                        {option.rationale.map((reason, reasonIndex) => (
                          <li key={reasonIndex}>{reason}</li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        className="calendar-reschedule-accept-button"
                        onClick={() => handleAcceptReschedule(option)}
                      >
                        Accept this option
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}