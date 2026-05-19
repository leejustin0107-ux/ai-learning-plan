const express = require('express');
const authenticate = require('../middleware/authenticate')
const router = express.Router();
const { z } = require('zod');
const logger = require('../utils/logger');
const db = require('../utils/db');
const Task = require('../models/Task');

router.post('/tasks', authenticate, async (req, res, next) => {
  try {
  const TaskInput = z.object({
    goal_id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    duration_estimate: z.number().min(25).max(90),
    planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    planned_slot: z.enum(['morning', 'afternoon', 'evening']),
    source: z.enum(['manual', 'ai']).default('manual'),
    rationale: z.string().optional(),
  });

  const data = TaskInput.parse(req.body);

  //check if goal belongs to user
  const goalCheck = await db.query(
    `SELECT id
    FROM goals
    where id = $1 AND user_id = $2`,
    [data.goal_id, req.user.id]
  );

  if (goalCheck.rows.length === 0) {
    return res.status(404).json({error: 'Goal not found'});
  }

  const task = await Task.create(data);

  logger.info({
    request_id: req.requestId,
    action: 'task_created',
    source: data.source,
    task_id: task.id,
  });

  res.status(201).json(task)
  } catch (err) {
    next(err);
  }
});


router.get('/goals/:goalId/tasks', authenticate, async (req, res, next) => {
  try {
    const goalCheck = await db.query(
      `SELECT id 
      FROM goals
      WHERE id = $1 AND user_id = $2`,
      [req.params.goalId, req.user.id]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found'});
    }

    const tasks = await db.query(
      `SELECT id, goal_id, title, description, duration_estimate,
              planned_date, planned_slot, source, rationale, status, created_at
       FROM tasks
       WHERE goal_id = $1
       ORDER BY planned_date ASC, created_at ASC`,
      [req.params.goalId]
    );

    res.json(tasks.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;