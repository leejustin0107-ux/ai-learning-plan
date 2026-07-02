import { useState } from 'react';
import { api } from '../services/api';
import '../styles/aisuggestionpanel.css'
import ErrorState from './ErrorState';
import RationaleDisplay from './RationaleDisplay';
 
function AISuggestionSkeleton() {
  return (
    <div className="ai-panel ai-skeleton-panel" aria-label="Loading AI suggestions">
      <div className="ai-skeleton-header">
        <div className="ai-skeleton-line ai-skeleton-title" />
        <div className="ai-skeleton-line ai-skeleton-subtitle" />
      </div>

      <div className="ai-skeleton-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="ai-skeleton-card" key={index}>
            <div className="ai-skeleton-line ai-skeleton-card-title" />
            <div className="ai-skeleton-line ai-skeleton-card-text" />
            <div className="ai-skeleton-line ai-skeleton-card-text short" />

            <div className="ai-skeleton-meta-row">
              <div className="ai-skeleton-pill" />
              <div className="ai-skeleton-pill" />
              <div className="ai-skeleton-pill" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
 
  function createTaskIdempotencyKey(task) {
    return [
      'ai-task',
      goalId,
      task.title,
      task.planned_date,
      task.planned_slot,
      task.duration_estimate,
    ]
      .join(':')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .slice(0, 255);
  }

  async function handleAccept(task, index) {
    
    if (acceptedIndexes.includes(index)) return;
    if (savingIndex === index) return;

    const idempotencyKey = createTaskIdempotencyKey(task);

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
        idempotency_key: idempotencyKey,
      });

      setAcceptedIndexes((prev) => {
        if (prev.includes(index)) return prev;
        return [...prev, index];
      });

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
    return <AISuggestionSkeleton />;
  }

  if (error) {
    return (
      <div className="ai-panel">
        <ErrorState
          message={error}
          onRetry={fetchSuggestions}
        />
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
          Suggest study plan
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

              <RationaleDisplay rationale={task.rationale} task={task} />

              {isAccepted && (
                <p className="accepted-message">
                  ✅ Added to your tasks
                </p>
              )}

              <div className="suggestion-actions">
                <button
                  type="button"
                  onClick={() => handleAccept(task, index)}
                  disabled={savingIndex === index || acceptedIndexes.includes(index)}
                >
                  {savingIndex === index
                    ? 'Accepting...'
                    : acceptedIndexes.includes(index)
                      ? 'Accepted'
                      : 'Accept'}
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