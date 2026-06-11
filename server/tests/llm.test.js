const {
  sanitizeContext,
  validateAIOutput,
  validateRescheduleOutput,
} = require('../src/services/llm');

process.env.LLM_PROVIDER = 'mock';
process.env.GEMINI_API_KEY = 'test-key';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});


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

describe('validateAIOutput detailed validation', () => {
  const validTask = {
    title: 'Study React Hooks',
    description: 'Learn useState and useEffect',
    duration_estimate: 45,
    planned_date: '2026-04-15',
    planned_slot: 'morning',
    rationale: 'Morning slot is available, hooks are a React foundation',
  };

  test('accepts valid output', () => {
    const input = JSON.stringify({
      tasks: [validTask],
      summary: 'This week plan',
    });

    const result = validateAIOutput(input);

    expect(result).not.toBeNull();
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Study React Hooks');
  });

  test('rejects duration below minimum 25 minutes', () => {
    const invalid = JSON.stringify({
      tasks: [{ ...validTask, duration_estimate: 10 }],
      summary: 'Test',
    });

    expect(validateAIOutput(invalid)).toBeNull();
  });

  test('rejects duration above maximum 90 minutes', () => {
    const invalid = JSON.stringify({
      tasks: [{ ...validTask, duration_estimate: 120 }],
      summary: 'Test',
    });

    expect(validateAIOutput(invalid)).toBeNull();
  });

  test('rejects response without rationale', () => {
    const invalid = JSON.stringify({
      tasks: [{ ...validTask, rationale: '' }],
      summary: 'Test',
    });

    expect(validateAIOutput(invalid)).toBeNull();
  });

  test('rejects invalid planned_slot', () => {
    const invalid = JSON.stringify({
      tasks: [{ ...validTask, planned_slot: 'midnight' }],
      summary: 'Test',
    });

    expect(validateAIOutput(invalid)).toBeNull();
  });

  test('rejects invalid JSON', () => {
    expect(validateAIOutput('not json')).toBeNull();
  });

  test('rejects response without tasks', () => {
    expect(validateAIOutput(JSON.stringify({ summary: 'Test' }))).toBeNull();
  });
  test('validateAIOutput accepts JSON wrapped in plain code block', () => {
  const raw = `
    \`\`\`
    {
      "tasks": [
        {
          "title": "Study SQL",
          "description": "Practice SELECT and JOIN queries",
          "duration_estimate": 45,
          "planned_date": "2026-04-15",
          "planned_slot": "evening",
          "rationale": "SQL is important for backend development"
        }
      ],
      "summary": "This week plan"
    }
    \`\`\`
    `;

  const result = validateAIOutput(raw);

  expect(result).not.toBeNull();
  expect(result.tasks[0].title).toBe('Study SQL');
  });

  test('validateRescheduleOutput accepts valid output without allowedTaskIds restriction', () => {
    const raw = JSON.stringify({
      task_id: 'task-999',
      suggested_date: '2026-04-15',
      suggested_slot: 'morning',
      reason: 'Morning has fewer tasks',
    });

    const result = validateRescheduleOutput(raw);

    expect(result).not.toBeNull();
    expect(result.task_id).toBe('task-999');
  });

  test('validateRescheduleOutput rejects invalid JSON', () => {
    const result = validateRescheduleOutput('not json');

    expect(result).toBeNull();
  });
});