import { useState } from 'react';
import { api } from '../services/api';
import WeeklyCalendar from '../components/WeeklyCalendar';
import '../styles/calendar.css';

export default function Calendar() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [rescheduleSuggestion, setRescheduleSuggestion] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleTaskClick(task) {
    setSelectedTask(task);
  }

  function closeTaskPopup() {
    setSelectedTask(null);
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
      setRescheduleSuggestion(null);

      const data = await api.post('/ai/plan/reschedule', {
        task_ids: [taskId],
      });

      setRescheduleSuggestion(data.recommendation);
    } catch (err) {
      console.error('failed to reschedule task:', err);
      alert(err.message);
    } finally {
      setRescheduling(false);
    }
  }

  async function handleAcceptReschedule() {
    if (!selectedTask || !rescheduleSuggestion) return;

    try {
      const data = await api.patch(`/tasks/${selectedTask.id}/schedule`, {
        planned_date: rescheduleSuggestion.suggested_date,
        planned_slot: rescheduleSuggestion.suggested_slot,
      });

      setSelectedTask(data.task);
      setRescheduleSuggestion(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('failed to accept reschedule:', err);
      alert(err.message);
    }
  }

  function handleDeclineReschedule() {
    setRescheduleSuggestion(null);
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
          <div className="task-popup">
            <button
              type="button"
              className="task-popup-close"
              onClick={closeTaskPopup}
            >
              ×
            </button>

            <h2>{selectedTask.title}</h2>
            <div className="task-popup-details">
              <p>
                <strong>Description:</strong>{' '}
                {selectedTask.description || 'No description'}
              </p>

              <p>
                <strong>Date:</strong> {formatDate(selectedTask.planned_date)}
              </p>

              <p>
                <strong>Slot:</strong> {selectedTask.planned_slot || 'No slot'}
              </p>

              <p>
                <strong>Duration:</strong>{' '}
                {selectedTask.duration_estimate
                  ? `${selectedTask.duration_estimate} minutes`
                  : 'No duration'}
              </p>

              <p>
                <strong>Status:</strong> {getTaskStatus(selectedTask)}
              </p>

              <div className="task-popup-actions">
                {getTaskStatus(selectedTask) === 'ongoing' && (
                  <button 
                    type="button" 
                    className="done-button"
                    onClick={() => handleMarkTaskDone(selectedTask.id)}
                  >
                    Mark as Done
                  </button>
                )}

                {getTaskStatus(selectedTask) === 'overdue' && (
                  <button
                    type="button"
                    className="reschedule-button"
                    onClick={() => handleRescheduleTask(selectedTask.id)}
                    disabled={rescheduling}
                  >
                    {rescheduling ? 'Rescheduling...' : 'Reschedule'}
                  </button>
                )}
                
                {rescheduleSuggestion && (
                  <div className="reschedule-suggestion">
                    <h3>AI Reschedule Suggestion</h3>

                    <p>
                      <strong>New Date:</strong> {rescheduleSuggestion.suggested_date}
                    </p>

                    <p>
                      <strong>New Slot:</strong> {rescheduleSuggestion.suggested_slot}
                    </p>

                    <p>
                      <strong>Reason:</strong> {rescheduleSuggestion.reason}
                    </p>

                    <div className="reschedule-actions">
                      <button
                        type="button"
                        className="accept-button"
                        onClick={handleAcceptReschedule}
                      >
                        Accept
                      </button>

                      <button
                        type="button"
                        className="decline-button"
                        onClick={handleDeclineReschedule}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {getTaskStatus(selectedTask) === 'finished' && (
                  <button 
                    type="button" 
                    className="delete-button"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                  >
                    Delete Task
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}