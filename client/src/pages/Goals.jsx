import { useState, useEffect } from 'react';
import { api } from '../services/api';
import AISuggestionPanel from '../components/AISuggestionPanel';
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

    if (!form?.title) {
      alert('Task title is required');
      return;
    }

    try {
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

  useEffect(() => {
    async function loadGoalsAndTasks() {
      try {
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
        console.error('Failed to load goals and tasks:', err);
      }
    }

    loadGoalsAndTasks();
  }, []);
 
  async function handleCreate(e) {
    e.preventDefault();

    try {
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

  function getGoalStatus(goal) {
    if (goal.status === 'done' || goal.status === 'finished') {
      return 'finished';
    }

    const today = new Date().toISOString().split('T')[0];

    if (goal.deadline && goal.deadline < today) {
      return 'overdue';
    }

    return 'ongoing';
  }

  function getTaskStatus(task) {
    if (task.status === 'done' || task.status === 'finished') {
      return 'finished';
    }

    const today = new Date().toISOString().split('T')[0];

    if (task.planned_date && task.planned_date < today) {
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

  return (
    <div className="goals-page">
      <div className="goals-header">
        <h1>Goals</h1>
        <p>Manage your learning goals and generate AI task breakdowns.</p>
      </div>
      <button className="add-goal-button" onClick={() => setShowModal(true)}>Add Goal</button>

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
                  onChange={(e) => setDeadline(e.target.value)}
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

      {!goals.length && (
        <div className="empty-goals">
          Belum ada goal. Tentukan apa yang ingin Anda pelajari.
        </div>
      )}

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
                  className="add-task-button"
                  onClick={() => setActiveTaskGoalId(goal.id)}
                >
                  +
                </button>

                <button
                  type="button"
                  className="ai-popup-button"
                  onClick={() => setActiveAIGoalId(goal.id)}
                >
                  AI
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDeleteGoal(goal.id)}
                >
                  Delete
                </button>

                <button
                  type="button"
                  className="task-dropdown-button"
                  onClick={() => toggleGoalTasks(goal.id)}
                >
                  {expandedGoals[goal.id] ? 'Hide Tasks' : 'Show Tasks'}
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
                          <span>{formatDate(task.planned_date)}</span>
                          <span>{task.planned_slot}</span>
                          <span>{task.duration_estimate} min</span>
                          <span className={`status-badge ${getTaskStatus(task)}`}>
                            {getTaskStatus(task)}
                          </span>
                        </div>
                        <div>
                          {getTaskStatus(task) === 'overdue' ? (
                            <button 
                              type="button" 
                              className="reschedule-button"
                            >
                              Reschedule
                            </button>
                          ) : getTaskStatus(task) === 'finished' ? (
                            <span className="finished-label">Done</span>
                          ) : (
                            <button
                              type="button"
                              className="done-button"
                              onClick={() => handleMarkTaskDone(task.id)}
                            >
                              Mark as Done
                            </button>
                          )}

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-tasks-message">No tasks added yet.</p>
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
    </div>
  );
}