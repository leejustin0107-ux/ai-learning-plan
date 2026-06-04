process.env.LLM_PROVIDER = 'mock';
process.env.GEMINI_API_KEY = 'test-key';

const {
  sanitizeContext,
  validateAIOutput,
  validateRescheduleOutput,
} = require('../src/services/llm');

describe('llm service', () => {
  test('sanitizeContext removes sensitive fields', () => {
    const context = {
      email: 'user@example.com',
      name: 'Justin',
      phone: '123456',
      goal: {
        title: 'Learn React',
      },
    };

    const result = sanitizeContext(context);

    expect(result.email).toBeUndefined();
    expect(result.name).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.goal.title).toBe('Learn React');
  });

  test('sanitizeContext does not mutate original object', () => {
    const context = {
      email: 'user@example.com',
      goal: {
        title: 'Learn Backend',
      },
    };

    const result = sanitizeContext(context);

    expect(result.email).toBeUndefined();
    expect(context.email).toBe('user@example.com');
  });

  test('validateAIOutput accepts valid AI suggestion output', () => {
    const raw = JSON.stringify({
      tasks: [
        {
          title: 'Study React Hooks',
          description: 'Learn useState and useEffect',
          duration_estimate: 45,
          planned_date: '2026-05-29',
          planned_slot: 'morning',
          rationale: 'Hooks are important for React development',
        },
      ],
      summary: 'Focus on React hooks this week',
    });

    const result = validateAIOutput(raw);

    expect(result).not.toBeNull();
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Study React Hooks');
    expect(result.tasks[0].planned_slot).toBe('morning');
  });

  test('validateAIOutput accepts JSON wrapped in markdown code block', () => {
    const raw = `
\`\`\`json
{
  "tasks": [
    {
      "title": "Study Express Routes",
      "description": "Practice creating REST API routes",
      "duration_estimate": 45,
      "planned_date": "2026-05-29",
      "planned_slot": "afternoon",
      "rationale": "Express routes are important for backend development"
    }
  ],
  "summary": "Focus on Express basics"
}
\`\`\`
`;

    const result = validateAIOutput(raw);

    expect(result).not.toBeNull();
    expect(result.tasks[0].title).toBe('Study Express Routes');
  });

  test('validateAIOutput rejects invalid AI suggestion output', () => {
    const raw = JSON.stringify({
      tasks: [
        {
          title: '',
          description: 'Invalid task',
          duration_estimate: 5,
          planned_date: 'bad-date',
          planned_slot: 'night',
          rationale: '',
        },
      ],
      summary: 'Invalid response',
    });

    const result = validateAIOutput(raw);

    expect(result).toBeNull();
  });

  test('validateRescheduleOutput accepts valid reschedule output', () => {
    const taskId = 'task-123';

    const raw = JSON.stringify({
      task_id: taskId,
      suggested_date: '2026-05-29',
      suggested_slot: 'afternoon',
      reason: 'This slot has fewer tasks',
    });

    const result = validateRescheduleOutput(raw, [taskId]);

    expect(result).not.toBeNull();
    expect(result.task_id).toBe(taskId);
    expect(result.suggested_slot).toBe('afternoon');
  });

  test('validateRescheduleOutput rejects wrong task id', () => {
    const raw = JSON.stringify({
      task_id: 'wrong-task',
      suggested_date: '2026-05-29',
      suggested_slot: 'afternoon',
      reason: 'This slot has fewer tasks',
    });

    const result = validateRescheduleOutput(raw, ['correct-task']);

    expect(result).toBeNull();
  });

  test('validateRescheduleOutput rejects invalid slot', () => {
    const raw = JSON.stringify({
      task_id: 'task-123',
      suggested_date: '2026-05-29',
      suggested_slot: 'night',
      reason: 'Invalid slot',
    });

    const result = validateRescheduleOutput(raw, ['task-123']);

    expect(result).toBeNull();
  });

  test('validateRescheduleOutput rejects missing suggested date', () => {
    const raw = JSON.stringify({
      task_id: 'task-123',
      suggested_slot: 'morning',
      reason: 'Missing date',
    });

    const result = validateRescheduleOutput(raw, ['task-123']);

    expect(result).toBeNull();
  });
});