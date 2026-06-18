import { useState, useEffect } from 'react';
import { api } from '../services/api';
import AISuggestionPanel from '../components/AISuggestionPanel';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { PageSkeleton } from '../components/Skeleton';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import '../styles/goals.css';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskForms, setTaskForms] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [activeTaskGoalId, setActiveTaskGoalId] = useState(null);
  const [activeAIGoalId, setActiveAIGoalId] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [goalTasks, setGoalTasks] = useState({});
  const [rescheduleSuggestions, setRescheduleSuggestions] = useState({});
  const [reschedulingTaskId, setReschedulingTaskId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalEditForm, setGoalEditForm] = useState({
    title: '',
    description: '',
    deadline: '',
  });

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskGoalDeadline, setEditingTaskGoalDeadline] = useState('');
  const [taskEditForm, setTaskEditForm] = useState({
    title: '',
    duration_estimate: 25,
    planned_date: '',
    planned_slot: 'morning',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const todayDate = getTodayDateString();

  const weekStart = '2026-05-11';

  function handleTaskFormChange(goalId, field, value) {
    setTaskForms((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value,
      },
    }));
  }

  async function handleCreateTask(e, goalId) {
    e.preventDefault();

    const form = taskForms[goalId];

    try {
      if (!form?.title) {
        alert('Task title is required');
        return;
      }

      const selectedTaskDate = taskForms[goalId]?.planned_date;
      const currentGoal = goals.find((goal) => goal.id === goalId);
      const goalDeadline = toDateInputValue(currentGoal?.deadline);

      if (selectedTaskDate && selectedTaskDate < todayDate) {
        setError('Task date cannot be before today.');
        return;
      }

      if (goalDeadline && selectedTaskDate > goalDeadline) {
        setError('Task date cannot be after the goal deadline.');
        return;
      }

      const createdTask = await api.post('/tasks', {
        goal_id: goalId,
        title: form.title,
        description: form.description || '',
        duration_estimate: Number(form.duration_estimate || 45),
        planned_date: form.planned_date,
        planned_slot: form.planned_slot || 'evening',
        source: 'manual',
      });

      setGoalTasks((prev) => ({
        ...prev,
        [goalId]: [...(prev[goalId] || []), createdTask],
      }));

      setExpandedGoals((prev) => ({
        ...prev,
        [goalId]: true,
      }));

      setTaskForms((prev) => ({
        ...prev,
        [goalId]: {
          title: '',
          description: '',
          duration_estimate: 45,
          planned_date: '',
          planned_slot: 'evening',
        },
      }));

      setActiveTaskGoalId(null);
    } catch (err) {
      console.error('Failed to create task:', err);
      alert(err.message);
    }
  }  

  async function fetchTasksForGoal(goalId) {
    try {
      const tasks = await api.get(`/goals/${goalId}/tasks`)

      setGoalTasks((prev) => ({
        ...prev,
        [goalId]: tasks,
      }));
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }

  async function loadGoalsAndTasks() {
    try {
      setLoading(true);
      setError(null);

      const goalsData = await api.get('/goals');
      setGoals(goalsData);

      const taskResults = await Promise.all(
        goalsData.map(async (goal) => {
          const tasks = await api.get(`/goals/${goal.id}/tasks`);
          return [goal.id, tasks];
        })
      );

      setGoalTasks(Object.fromEntries(taskResults));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoalsAndTasks();
  }, []);
 
  async function handleCreate(e) {
    e.preventDefault();

    try {
    if (deadline && deadline < todayDate) {
      setError('Goal deadline cannot be before today.');
      return;
    }
    const newGoal = await api.post('/goals', {
      title,
      deadline: deadline || undefined,
    });

    setGoals([newGoal, ...goals]);
    setTitle('');
    setDeadline('');
    setShowModal(false);
    } catch (err) {
      console.error('Failed to create goal:', err);
      alert(err.message)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'No deadline';

    return new Date(dateString).toLocaleDateString();
  }

  function handleAcceptedTask(createdTask) {
    setGoalTasks((prev) => ({
      ...prev,
      [createdTask.goal_id]: [...(prev[createdTask.goal_id] || []), createdTask],
    }));

    setExpandedGoals((prev) => ({
      ...prev,
      [createdTask.goal_id]: true,
    }));
  }

  function toDateInputValue(value) {
    if (!value) return '';

    const dateString = String(value);

    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      return dateString.slice(0, 10);
    }

    return '';
  }


  function toggleGoalTasks(goalId) {
    setExpandedGoals((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  }
  
  async function handleDeleteGoal(goalId) {
    const confirmed = window.confirm('Are you sure you want to delete this goal?');

    if (!confirmed) return;

    try {
      await api.delete(`/goals/${goalId}`);

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));

      setGoalTasks((prev) => {
        const updated = { ...prev };
        delete updated[goalId];
        return updated;
      });
    } catch (err) {
      console.error('failed to delete goal:', err);
      alert(err.message);
    }
  }

  async function handleDeleteTask(taskId) {
    const confirmed = window.confirm('Are you sure you want to delete this task?');

    if (!confirmed) return;

    try{
      await api.delete(`/tasks/${taskId}`);

      setGoalTasks((prev) => {
        const updated = {};

        for (const goalId in prev) {
          updated[goalId] = prev[goalId].filter((task) => task.id !== taskId);
        }

        return updated
      });
    } catch (err) {
    console.error('failed to delete task:', err);
    alert(err.message);
    } 
  }

  function openEditGoalModal(goal) {
  setEditingGoalId(goal.id);
  setGoalEditForm({
    title: goal.title || '',
    description: goal.description || '',
    deadline: toDateInputValue(goal.deadline),
  });
}

function closeEditGoalModal() {
  setEditingGoalId(null);
  setGoalEditForm({
    title: '',
    description: '',
    deadline: '',
  });
}

  function getGoalStatus(goal) {
    if (goal.status === 'done' || goal.status === 'finished') {
      return 'finished';
    }

    const today = formatLocalDate(new Date());

    if (goal.deadline < today) {
      return 'overdue';
    }

    return 'ongoing';
  }

  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function toDateInputValue(value) {
    if (!value) return '';

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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

  async function handleMarkTaskDone(taskId) {
    try {
      const data = await api.patch(`/tasks/${taskId}/status`);

      const updatedTask = data.task;

      setGoalTasks((prev) => {
        const updated = {};

        for (const goalId in prev) {
          updated[goalId] = prev[goalId].map((task) => 
            task.id === taskId ? updatedTask : task
          );
        }

        return updated;
      });
    } catch (err) {
      console.error('failed to mark task as done:', err);
      alert(err.message);
    }
  }

  function openEditGoalModal(goal) {
    setEditingGoalId(goal.id);
    setGoalEditForm({
      title: goal.title || '',
      description: goal.description || '',
      deadline: toDateInputValue(goal.deadline),
    });
  }

  function closeEditGoalModal() {
    setEditingGoalId(null);
    setGoalEditForm({
      title: '',
      description: '',
      deadline: '',
    });
  }

  async function handleUpdateGoal(e) {
    e.preventDefault();

    try {
      const payload = {
        title: goalEditForm.title.trim(),
        description: goalEditForm.description.trim(),
      };

      if (goalEditForm.deadline) {
        payload.deadline = goalEditForm.deadline;
      }

      if (goalEditForm.deadline && goalEditForm.deadline < todayDate) {
        setError('Goal deadline cannot be before today.');
        return;
      }

      await api.patch(`/goals/${editingGoalId}`, payload);

      closeEditGoalModal();
      await loadGoalsAndTasks();
    } catch (err) {
      console.error(err);
      setError('Failed to update goal. Please try again.');
    }
  }

  function openEditTaskModal(task, goal) {
    setEditingTaskId(task.id);
    setEditingTaskGoalDeadline(toDateInputValue(goal.deadline));

    setTaskEditForm({
      title: task.title || '',
      duration_estimate: task.duration_estimate || 25,
      planned_date: toDateInputValue(task.planned_date),
      planned_slot: task.planned_slot || 'morning',
    });
  }

  function closeEditTaskModal() {
    setEditingTaskId(null);
    setEditingTaskGoalDeadline('');
    setTaskEditForm({
      title: '',
      duration_estimate: 25,
      planned_date: '',
      planned_slot: 'morning',
    });
  }

  async function handleUpdateTask(e) {
    e.preventDefault();

    const duration = Number(taskEditForm.duration_estimate);

    if (!taskEditForm.title.trim()) {
      setError('Task title is required.');
      return;
    }

    if (!Number.isFinite(duration) || duration < 25 || duration > 90) {
      setError('Task duration must be between 25 and 90 minutes.');
      return;
    }

    if (!taskEditForm.planned_date) {
      setError('Planned date is required.');
      return;
    }

    if (!taskEditForm.planned_slot) {
      setError('Planned slot is required.');
      return;
    }

    if (taskEditForm.planned_date && taskEditForm.planned_date < todayDate) {
      setError('Task date cannot be before today.');
      return;
    }

    if (
      editingTaskGoalDeadline &&
      taskEditForm.planned_date > editingTaskGoalDeadline
    ) {
      setError('Task date cannot be after the goal deadline.');
      return;
    }

    try {
      await api.patch(`/tasks/${editingTaskId}`, {
        title: taskEditForm.title.trim(),
        duration_estimate: duration,
        planned_date: taskEditForm.planned_date,
        planned_slot: taskEditForm.planned_slot,
      });

      closeEditTaskModal();
      await loadGoalsAndTasks();
    } catch (err) {
      console.error(err);
      setError('Failed to update task. Please try again.');
    }
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

  async function handleRescheduleTask(taskId) {
    try {
      setReschedulingTaskId(taskId);

      setRescheduleSuggestions((prev) => ({
        ...prev,
        [taskId]: null,
      }));

      const data = await api.post('/ai/plan/reschedule', {
        task_ids: [taskId],
      });

      setRescheduleSuggestions((prev) => ({
        ...prev,
        [taskId]: data.recommendation,
      }));
    } catch (err) {
      console.error('failed to reschedule task:', err);
      alert(err.message);
    } finally {
      setReschedulingTaskId(null);
    }
  }

  async function handleAcceptReschedule(taskId) {
    const suggestion = rescheduleSuggestions[taskId];

    if (!suggestion) return;

    try {
      const data = await api.patch(`/tasks/${taskId}/schedule`, {
        planned_date: suggestion.suggested_date,
        planned_slot: suggestion.suggested_slot,
      });

      const updatedTask = data.task;

      setGoalTasks((prev) => {
        const updated = {};

        for (const goalId in prev) {
          updated[goalId] = prev[goalId].map((task) =>
            task.id === taskId ? updatedTask : task
          );
        }

        return updated;
      });

      setRescheduleSuggestions((prev) => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
    } catch (err) {
      console.error('failed to accept reschedule:', err);
      alert(err.message);
    }
  }

  function handleDeclineReschedule(taskId) {
    setRescheduleSuggestions((prev) => {
      const updated = { ...prev };
      delete updated[taskId];
      return updated;
    });
  }

  return (
    <div className="goals-page">
      <div className="goals-header">
        <h1>Goals</h1>
        <p>Manage your learning goals and generate AI task breakdowns.</p>
      </div>
      <button className="add-goal-button" onClick={() => setShowModal(true)}>Add Goal</button>

      {loading && <PageSkeleton type="cards" />}

      {error && (
        <ErrorState
          message={error}
          onRetry={loadGoalsAndTasks}
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="goal-modal">
            <div className="goal-modal-header">
              <h2>Add New Goal</h2>
              <p>Create a new learning goal and set an optional deadline.</p>
            </div>
            <form className="goal-modal-form" onSubmit={handleCreate}>
              <div className="form-field">
                <label>Goal Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Goal baru..."
                  required
                />
              </div>

              <div className="form-field">
                <label>Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  min={todayDate}
                  onChange={(e) => setDeadline(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  Add Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!loading && !error && !goals.length && (
        <EmptyState
          type="goals"
          onAction={() => setShowModal(true)}
        />
      )}

      {!loading && !error && goals.length > 0 && (
        <ul className="goals-list">
          {goals.map((goal) => (
            <li className="goal-card" key={goal.id}>
              <div className={`goal-status-bar ${getGoalStatus(goal)}`}></div>

              <div className="goal-card-header">
                <div>
                  <p className="goal-title">{goal.title}</p>

                  <span className="goal-deadline">
                    Deadline: {formatDate(goal.deadline)}
                  </span>
                </div>

                <span className={`status-badge ${getGoalStatus(goal)}`}>
                  {getGoalStatus(goal)}
                </span>

                <div className="goal-action-buttons">
                  <button
                    type="button"
                    className="icon-button edit-button"
                    onClick={() => openEditGoalModal(goal)}
                    aria-label={`Edit goal "${goal.title}"`}
                    title="Edit goal"
                  >
                    <Pencil size={18} aria-hidden="true" />
                  </button>

                  <button 
                    type="button"
                    className="add-task-button"
                    onClick={() => setActiveTaskGoalId(goal.id)}
                    aria-label={`Add task to goal "${goal.title}"`}
                  >
                    <Plus size={18} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    aria-label={`Delete goal "${goal.title}"`}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="task-dropdown-button"
                    onClick={() => toggleGoalTasks(goal.id)}
                    aria-label={`${expandedGoals[goal.id] === goal.id ? 'Hide' : 'Show'} tasks for goal "${goal.title}"`}
                    aria-expanded={expandedGoals[goal.id] === goal.id}
                  >
                    {expandedGoals[goal.id] ? (
                      <ChevronUp size={18} aria-hidden="true" /> 
                    ) : (
                      <ChevronDown size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {expandedGoals[goal.id] && (
                <div className="tasks-dropdown">
                  {goalTasks[goal.id]?.length ? (
                    <ul className="task-list">
                      {goalTasks[goal.id].map((task) => (
                        <li className={`task-row ${getTaskStatus(task)}`} key={task.id}>
                          <div>
                            <p className="task-title">{task.title}</p>

                            {task.description && (
                              <p className="task-description">{task.description}</p>
                            )}
                          </div>

                          <div className="task-meta">
                            <span className="task-meta-pill">{formatDate(task.planned_date)}</span>
                            <span className="task-meta-pill">{task.planned_slot}</span>
                            <span className="task-meta-pill">{task.duration_estimate} min</span>
                            <span className={`task-meta-pill status-badge ${getTaskStatus(task)}`}>
                              {getTaskStatus(task)}
                            </span>
                          </div>
                          <div className="task-row-actions">
                            <button
                              type="button"
                              className="icon-button edit-button"
                              onClick={() => openEditTaskModal(task, goal)}
                              aria-label={`Edit task "${task.title}"`}
                              title="Edit task"
                            >
                              <Pencil size={18} aria-hidden="true" />
                            </button>

                            {getTaskStatus(task) === 'overdue' ? (
                              <button 
                                type="button" 
                                className="icon-button reschedule-button"
                                onClick={() => handleRescheduleTask(task.id)}
                                aria-label={`Reschedule task "${task.title}"`}
                                title="Reschedule task"
                                disabled={reschedulingTaskId === task.id}
                              >
                                <RotateCcw size={17} aria-hidden="true" />
                              </button>
                            ) : getTaskStatus(task) === 'finished' ? (
                              <span className="finished-label">Done</span>
                            ) : (
                              <button
                                type="button"
                                className="icon-button done-button"
                                onClick={() => handleMarkTaskDone(task.id)}
                                aria-label={`Mark task "${task.title}" as done`}
                                title="Mark as done"
                              >
                                <Check size={18} aria-hidden="true" />
                              </button>
                            )}

                            <button
                              type="button"
                              className="icon-button delete-button"
                              onClick={() => handleDeleteTask(task.id)}
                              aria-label={`Delete task "${task.title}"`}
                              title="Delete task"
                            >
                              <Trash2 size={18} aria-hidden="true" />
                            </button>
                          </div>

                          {rescheduleSuggestions[task.id] && (
                            <div className="goal-reschedule-suggestion">
                              <h4>AI Reschedule Suggestion</h4>

                              <p>
                                <strong>New Date:</strong>{' '}
                                {rescheduleSuggestions[task.id].suggested_date}
                              </p>

                              <p>
                                <strong>New Slot:</strong>{' '}
                                {rescheduleSuggestions[task.id].suggested_slot}
                              </p>

                              <p>
                                <strong>Reason:</strong>{' '}
                                {rescheduleSuggestions[task.id].reason}
                              </p>

                              <div className="reschedule-actions">
                                <button
                                  type="button"
                                    className="accept-button"
                                    onClick={() => handleAcceptReschedule(task.id)}
                                >
                                  Accept
                                </button>

                                <button
                                  type="button"
                                  className="decline-button"
                                  onClick={() => handleDeclineReschedule(task.id)}
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      type="tasks"
                      onAction={() => setActiveAIGoalId(goal.id)}
                    />
                  )}
                </div>
              )}
                
              {activeTaskGoalId === goal.id && (
                <div className="task-modal-overlay">
                  <div className="task-modal">
                    <form
                      className="task-modal-form"
                      onSubmit={(e) => handleCreateTask(e, goal.id)}
                    >
                      <div className="task-modal-header">
                        <h2>Add Manual Task</h2>
                        <p>Add a task for: {goal.title}</p>
                      </div>

                      <div className="task-form-field">
                        <label>Task Title</label>
                        <input
                          type="text"
                          placeholder="Example: Study React state"
                          value={taskForms[goal.id]?.title || ''}
                          onChange={(e) =>
                            handleTaskFormChange(goal.id, 'title', e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="task-form-field">
                        <label>Description</label>
                        <input
                          type="text"
                          placeholder="Example: Practice useState and forms"
                          value={taskForms[goal.id]?.description || ''}
                          onChange={(e) =>
                            handleTaskFormChange(goal.id, 'description', e.target.value)
                          }
                        />
                      </div>

                      <div className="task-form-field">
                        <label>Duration</label>
                        <input
                          type="number"
                          min="25"
                          max="90"
                          placeholder="45"
                          value={taskForms[goal.id]?.duration_estimate || 45}
                          onChange={(e) =>
                            handleTaskFormChange(goal.id, 'duration_estimate', e.target.value)
                          }
                          />
                      </div>

                      <div className="task-form-field">
                        <label>Planned Date</label>
                        <input
                          type="date"
                          value={taskForms[goal.id]?.planned_date || ''}
                          min={todayDate}
                          max={toDateInputValue(goal.deadline) || undefined}
                          onChange={(e) =>
                            handleTaskFormChange(goal.id, 'planned_date', e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="task-form-field">
                        <label>Preferred Slot</label>
                        <select
                          value={taskForms[goal.id]?.planned_slot || 'evening'}
                          onChange={(e) =>
                          handleTaskFormChange(goal.id, 'planned_slot', e.target.value)
                          }
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                        </select>
                      </div>
                      
                      <div className="task-modal-actions">
                        <button
                          type="button"
                          className="task-ai-button"
                          onClick={() => {
                            setActiveTaskGoalId(null);
                            setActiveAIGoalId(goal.id);
                          }}
                          aria-label={`Open AI task suggestions for goal "${goal.title}"`}
                        >
                          AI Suggest Task
                        </button>

                        <div className="task-modal-right-actions">
                          <button
                            type="button"
                            className="task-cancel-button"
                            onClick={() => setActiveTaskGoalId(null)}
                          >
                            Cancel
                          </button>

                          <button type="submit" 
                          className="task-submit-button"
                          >
                            Add Task
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeAIGoalId === goal.id && (
                <div className="ai-modal-overlay">
                  <div className="ai-modal">
                    <div className="ai-modal-header">
                      <div>
                        <h2>AI Task Suggestions</h2>
                        <p>Generate task breakdowns for: {goal.title}</p>
                      </div>

                      <button
                        type="button"
                        className="ai-modal-close"
                        onClick={() => setActiveAIGoalId(null)}
                      >
                        ×
                      </button>
                    </div>

                    <AISuggestionPanel
                      goalId={goal.id}
                      weekStart={weekStart}
                      onAccept={handleAcceptedTask}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editingGoalId && (
        <div className="task-modal-overlay">
          <div className="task-modal">
            <form className="task-modal-form" onSubmit={handleUpdateGoal}>
              <div className="task-modal-header">
                <h2>Edit Goal</h2>
                <p>Update your learning goal details.</p>
              </div>

              <div className="task-form-field">
                <label htmlFor="edit-goal-title">Goal Title</label>
                <input
                  id="edit-goal-title"
                  type="text"
                  value={goalEditForm.title}
                  onChange={(e) =>
                    setGoalEditForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="task-form-field">
                <label htmlFor="edit-goal-description">Description</label>
                <textarea
                  id="edit-goal-description"
                  value={goalEditForm.description}
                  onChange={(e) =>
                    setGoalEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows="4"
                />
              </div>

              <div className="task-form-field">
                <label htmlFor="edit-goal-deadline">Deadline</label>
                <input
                  id="edit-goal-deadline"
                  type="date"
                  value={goalEditForm.deadline}
                  min={todayDate}
                  onChange={(e) =>
                    setGoalEditForm((prev) => ({
                      ...prev,
                      deadline: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="task-modal-actions">
                <button
                  type="button"
                  className="task-cancel-button"
                  onClick={closeEditGoalModal}
                >
                  Cancel
                </button>

                <button type="submit" className="task-submit-button">
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTaskId && (
        <div className="task-modal-overlay">
          <div className="task-modal">
            <form className="task-modal-form" onSubmit={handleUpdateTask}>
              <div className="task-modal-header">
                <h2>Edit Task</h2>
                <p>Update task details and schedule.</p>
              </div>

              <div className="task-form-field">
                <label htmlFor="edit-task-title">Task Title</label>
                <input
                  id="edit-task-title"
                  type="text"
                  value={taskEditForm.title}
                  onChange={(e) =>
                    setTaskEditForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="task-form-field">
                <label htmlFor="edit-task-duration">Duration Estimate</label>
                <input
                  id="edit-task-duration"
                  type="number"
                  min="25"
                  max="90"
                  value={taskEditForm.duration_estimate}
                  onChange={(e) =>
                    setTaskEditForm((prev) => ({
                      ...prev,
                      duration_estimate: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="task-form-field">
                <label htmlFor="edit-task-date">Planned Date</label>
                <input
                  id="edit-task-date"
                  type="date"
                  value={taskEditForm.planned_date}
                  min={todayDate}
                  max={editingTaskGoalDeadline || undefined}
                  onChange={(e) =>
                    setTaskEditForm((prev) => ({
                      ...prev,
                      planned_date: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="task-form-field">
                <label htmlFor="edit-task-slot">Planned Slot</label>
                <select
                  id="edit-task-slot"
                  value={taskEditForm.planned_slot}
                  onChange={(e) =>
                    setTaskEditForm((prev) => ({
                      ...prev,
                      planned_slot: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>

              <div className="task-modal-actions">
                <button
                  type="button"
                  className="task-cancel-button"
                  onClick={closeEditTaskModal}
                >
                  Cancel
                </button>

                <button type="submit" className="task-submit-button">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}