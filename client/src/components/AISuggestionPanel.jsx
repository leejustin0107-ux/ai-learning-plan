import { useState } from 'react';
import { api } from '../services/api';
import '../styles/aisuggestionpanel.css'
 
function AISuggestionPanel({ goalId, weekStart, onAccept }) {
  const [suggestions, setSuggestions] = useState(null);
  const [acceptedIndexes, setAcceptedIndexes] = useState([]);
  const [rejectedIndexes, setRejectedIndexes] = useState([]);
  const [savingIndex, setSavingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
 
  async function fetchSuggestions() {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setAcceptedIndexes([]);
    setRejectedIndexes([]);

    try {
      const data = await api.post('/ai/plan/suggest', {
        goal_id: goalId,
        week_start: weekStart,
      });
      setSuggestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  async function handleAccept(task, index) {
    // Prevent duplicate saves
    if (acceptedIndexes.includes(index)) return;

    setSavingIndex(index);
    setError(null);

    try {
      const created = await api.post('/tasks', {
        goal_id: goalId,
        title: task.title,
        description: task.description,
        duration_estimate: task.duration_estimate,
        planned_date: task.planned_date,
        planned_slot: task.planned_slot,
        source: 'ai',
        rationale: task.rationale,
      });

      setAcceptedIndexes((prev) => [...prev, index]);

      if (onAccept) {
        onAccept(created);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingIndex(null);
    }
  }

  function handleReject(index) {
    setRejectedIndexes((prev) => [...prev, index]);
  }
 
  if (loading) {
    return (
      <div className="ai-panel">
        <p>Loading AI suggestions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>⚠️ {error}</p>

        <button onClick={fetchSuggestions}>Coba lagi</button>
      </div>
    );
  }
  
  if (!suggestions) {
    return (
      <div className="ai-panel">
        <h3>AI Study Plan</h3>

        <p>
          Let AI suggest a weekly task breakdown for this goal.
        </p>

        <button type="button" onClick={fetchSuggestions}>
          🤖 Suggest study plan
        </button>
      </div>
    );
  }

  const visibleTasks = suggestions.tasks.filter(
    (_, index) => !rejectedIndexes.includes(index)
  );
 
  return (
    <div className="ai-panel">
      <h3>AI Suggested Plan</h3>

      <p className="summary">{suggestions.summary}</p>

      {visibleTasks.length === 0 && (
        <p className="empty-state">
          All suggestions were rejected.
        </p>
      )}

      <div className="suggestion-list">
        {suggestions.tasks.map((task, index) => {
          if (rejectedIndexes.includes(index)) {
            return null;
          }

          const isAccepted = acceptedIndexes.includes(index);
          const isSaving = savingIndex === index;

          return (
            <div
              key={index}
              className={`suggestion-card ${
                isAccepted ? 'accepted-card' : ''
              }`}
            >
              <h4>{task.title}</h4>

              <p>{task.description}</p>

              <p className="rationale">
                <strong>Why:</strong> {task.rationale}
              </p>

              <p className="meta">
                {task.duration_estimate} minutes · {task.planned_date} ·{' '}
                {task.planned_slot}
              </p>

              {isAccepted && (
                <p className="accepted-message">
                  ✅ Added to your tasks
                </p>
              )}

              <div className="suggestion-actions">
                <button
                  type="button"
                  onClick={() => handleAccept(task, index)}
                  disabled={isAccepted || isSaving}
                >
                  {isSaving
                    ? 'Saving...'
                    : isAccepted
                      ? 'Accepted'
                      : '✅ Accept'}
                </button>

                <button
                  type="button"
                  onClick={() => handleReject(index)}
                  disabled={isAccepted || isSaving}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="refresh-suggestions"
        onClick={fetchSuggestions}
      >
        🔄 Regenerate plan
      </button>
    </div>
  );
}

export default AISuggestionPanel;