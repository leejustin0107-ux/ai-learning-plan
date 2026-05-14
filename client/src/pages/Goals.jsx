import { useState, useEffect } from 'react';
import { api } from '../services/api';
import AISuggestionPanel from '../components/AISuggestionPanel';
import '../styles/goals.css';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskForms, setTaskForms] = useState({});

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

      console.log('Manual task created:', createdTask);

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
    } catch (err) {
      console.error('Failed to create task:', err);
      alert(err.message);
    }
  }  


  useEffect(() => {
    api.get('/goals').then(setGoals);
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
    console.log('Accepted task:', createdTask)
  }
  
  return (
    <div className="goals-page">
      <div className="goals-header">
        <h1>Goals</h1>
        <p>Manage your learning goals and generate AI task breakdowns.</p>
      </div>

      <form className="goal-form" onSubmit={handleCreate}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Goal baru..."
          required
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <button type="submit">Tambah</button>
      </form>

      {!goals.length && (
        <div className="empty-goals">
          Belum ada goal. Tentukan apa yang ingin Anda pelajari.
        </div>
      )}

      <ul className="goals-list">
        {goals.map((goal) => (
          <li className="goal-card" key={goal.id}>
            <div className="goal-card-header">
              <p className="goal-title">{goal.title}</p>

              {goal.deadline && (
                <span className="goal-deadline">
                  Deadline: {formatDate(goal.deadline)}
                </span>
              )}
            </div>

            <form
              className="manual-task-form"
              onSubmit={(e) => handleCreateTask(e, goal.id)}
            >
              <h4>Add Manual Task</h4>

              <div className="form-field">
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

              <div className="form-field">
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

              <div className="form-field">
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

              <div className="form-field">
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

              <div className="form-field">
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
                  <option value="night">Night</option>
                </select>
              </div>

              <button type="submit">Add Task</button>
            </form>

            <AISuggestionPanel
              goalId={goal.id}
              weekStart={weekStart}
              onAccept={handleAcceptedTask}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}