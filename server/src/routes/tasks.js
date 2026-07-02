const express = require('express');
const authenticate = require('../middleware/authenticate')
const router = express.Router();
const { z } = require('zod');
const logger = require('../utils/logger');
const db = require('../utils/db');
const Task = require('../models/Task');
const { recalculateProgress } = require('../services/progress');
const appEvents = require('../services/events');
const { getCurrentWeek } = require('../utils/week');


router.post('/tasks', authenticate, async (req, res, next) => {
  try {
    const TaskInput = z.object({
      goal_id: z.string().uuid(),
      title: z.string().min(1),
      description: z.string().optional(),
      duration_estimate: z.number().int().min(25).max(90),
      planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      planned_slot: z.enum(['morning', 'afternoon', 'evening']),
      source: z.enum(['manual', 'ai']).default('manual'),
      rationale: z.string().optional(),
      idempotency_key: z.string().min(1).max(255).optional(),
    });

    const data = TaskInput.parse(req.body);

    // Check if goal belongs to user
    const goalCheck = await db.query(
      `SELECT id
       FROM goals
       WHERE id = $1 AND user_id = $2`,
      [data.goal_id, req.user.id]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (data.idempotency_key) {
      const existingTask = await db.query(
        `SELECT t.*
         FROM tasks t
         JOIN goals g ON t.goal_id = g.id
         WHERE g.user_id = $1
         AND t.goal_id = $2
         AND t.idempotency_key = $3
         LIMIT 1`,
        [req.user.id, data.goal_id, data.idempotency_key]
      );

      if (existingTask.rows.length > 0) {
        return res.status(200).json({
          ...existingTask.rows[0],
          idempotent: true,
        });
      }
    }

    try {
      const task = await Task.create(data);

      logger.info({
        request_id: req.requestId,
        action: 'task_created',
        source: data.source,
        task_id: task.id,
      });

      return res.status(201).json(task);
    } catch (err) {
      
      if (err.code === '23505' && data.idempotency_key) {
        const existingTask = await db.query(
          `SELECT t.*
           FROM tasks t
           JOIN goals g ON t.goal_id = g.id
           WHERE g.user_id = $1
           AND t.goal_id = $2
           AND t.idempotency_key = $3
           LIMIT 1`,
          [req.user.id, data.goal_id, data.idempotency_key]
        );

        if (existingTask.rows.length > 0) {
          return res.status(200).json({
            ...existingTask.rows[0],
            idempotent: true,
          });
        }
      }

      throw err;
    }
  } catch (err) {
    next(err);
  }
});

router.get('/tasks', authenticate, async (req, res, next) => {
  try {
    const requestedWeekStart = String(
      req.query.week_start || req.query.weekStart || ''
    ).trim();

    if (!requestedWeekStart || !/^\d{4}-\d{2}-\d{2}$/.test(requestedWeekStart)) {
      return res.status(400).json({
        error: 'week_start must use YYYY-MM-DD format',
      });
    }

    const weekStart = requestedWeekStart;

    const weekEndDate = new Date(`${weekStart}T00:00:00`);

    if (Number.isNaN(weekEndDate.getTime())) {
      return res.status(400).json({
        error: 'week_start must be a valid date',
      });
    }

    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const year = weekEndDate.getFullYear();
    const month = String(weekEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(weekEndDate.getDate()).padStart(2, '0');

    const weekEnd = `${year}-${month}-${day}`;
 
    const tasks = await db.query(
      `SELECT * FROM tasks
       WHERE goal_id IN (SELECT id FROM goals WHERE user_id = $1)
       AND planned_date BETWEEN $2 AND $3
       ORDER BY planned_date, planned_slot`,
      [req.user.id, weekStart, weekEnd]
    );
    
    function formatLocalDate(date) {
      const d = new Date(date);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    const grouped = {};
    for (const task of tasks.rows) {
      const day = formatLocalDate(task.planned_date);
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(task);
    }
 
    res.json({ weekStart, weekEnd, tasks: grouped });
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
    const { status = 'done', actual_duration } = req.body || {};

    if (status !== 'done') {
      return res.status(400).json({
        error: 'Status transition is not allowed',
      });
    }

    const taskCheck = await db.query(
      `SELECT t.*
       FROM tasks t
       JOIN goals g ON t.goal_id = g.id
       WHERE t.id = $1
       AND g.user_id = $2`,
      [req.params.taskId, req.user.id]
    );

    if (!taskCheck.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const existingTask = taskCheck.rows[0];

    if (existingTask.status === 'done') {
      return res.json({ task: existingTask });
    }

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

    const updatedTask = result.rows[0];

    if (updatedTask.planned_date) {
      await recalculateProgress(req.user.id, updatedTask.planned_date);
    }

    appEvents.emit('task:completed', {
      userId: req.user.id,
      taskId: updatedTask.id,
    });

    const currentWeek = getCurrentWeek();

    const weekProgress = await db.query(
      `SELECT completion_rate
       FROM progress_snapshots
       WHERE user_id = $1 AND week = $2`,
      [req.user.id, currentWeek]
    );

    const completionRate = parseFloat(
      weekProgress.rows[0]?.completion_rate || 0
    );

    if (completionRate >= 1.0) {
      appEvents.emit('milestone:reached', {
        userId: req.user.id,
        milestone: `week_${currentWeek}_complete`,
      });
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

router.patch('/tasks/:taskId', authenticate, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id || req.user.userId;

    const allowedFields = [
      'title',
      'duration_estimate',
      'planned_date',
      'planned_slot',
      'status',
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        values.push(req.body[field]);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields provided for update',
      });
    }

    values.push(taskId);
    values.push(userId);

    const taskIdIndex = values.length - 1;
    const userIdIndex = values.length;

    const result = await db.query(
      `
      UPDATE tasks t
      SET ${updates.join(', ')}
      FROM goals g
      WHERE t.goal_id = g.id
        AND t.id = $${taskIdIndex}
        AND g.user_id = $${userIdIndex}
      RETURNING t.*;
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;