const express = require('express');
const authenticate = require('../middleware/authenticate')
const router = express.Router();
const { z } = require('zod');
const logger = require('../utils/logger');
const db = require('../utils/db');
const Task = require('../models/Task');
const { recalculateProgress } = require('../services/progress');

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

router.get('/tasks', authenticate, async (req, res, next) => {
  try {
    const { week_start } = req.query; // format: 2026-04-06
 
    if (!week_start) {
      return res.status(400).json({ error: 'Parameter week_start diperlukan (format: YYYY-MM-DD)' });
    }
 
    const weekEnd = new Date(week_start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndString = weekEnd.toISOString().split('T')[0];
 
    const tasks = await db.query(
      `SELECT * FROM tasks
       WHERE goal_id IN (SELECT id FROM goals WHERE user_id = $1)
       AND planned_date BETWEEN $2 AND $3
       ORDER BY planned_date, planned_slot`,
      [req.user.id, week_start, weekEndString]
    );
    
    function formatLocalDate(date) {
      const d = new Date(date);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    // Kelompokkan per hari untuk memudahkan rendering kalender
    const grouped = {};
    for (const task of tasks.rows) {
      const day = formatLocalDate(task.planned_date);
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(task);
    }
 
    res.json({ week_start, week_end: weekEndString, tasks: grouped });
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

router.patch('/tasks/:taskId/status', authenticate, async (req, res, next) => {
  try {
    const { actual_duration } = req.body || {};

    const result = await db.query(
      `UPDATE tasks t
       SET status = 'done',
           completed_at = NOW(),
           actual_duration = COALESCE($3, t.duration_estimate)
       FROM goals g
       WHERE t.goal_id = g.id
       AND t.id = $1
       AND g.user_id = $2
       RETURNING t.*`,
      [req.params.taskId, req.user.id, actual_duration]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = result.rows[0];


    if (updatedTask.planned_date) {
      await recalculateProgress(req.user.id, updatedTask.planned_date);
    }

    res.json({ task: updatedTask });
  } catch (err) {
    next(err);
  }
});

router.delete('/tasks/:taskId', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM tasks t
       USING goals g
       WHERE t.goal_id = g.id
       AND t.id = $1
       AND g.user_id = $2
       RETURNING t.id, t.planned_date`,
      [req.params.taskId, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = result.rows[0];

    if (deletedTask.planned_date) {
      await recalculateProgress(req.user.id, deletedTask.planned_date);
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.patch('/tasks/:taskId/schedule', authenticate, async (req, res, next) => {
  try {
    const { planned_date, planned_slot } = req.body;

    if (!planned_date || !planned_slot) {
      return res.status(400).json({
        error: 'planned_date and planned_slot are required',
      });
    }

    const result = await db.query(
      `UPDATE tasks t
       SET planned_date = $1,
           planned_slot = $2,
           status = 'todo'
       FROM goals g
       WHERE t.goal_id = g.id
       AND t.id = $3
       AND g.user_id = $4
       RETURNING t.*`,
      [planned_date, planned_slot, req.params.taskId, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;