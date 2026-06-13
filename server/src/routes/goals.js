const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../utils/db');
const authenticate = require('../middleware/authenticate');
const { recalculateProgress } = require('../services/progress');
 
const GoalInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
 
// Create
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = GoalInput.parse(req.body);
    const goal = await db.query(
      'INSERT INTO goals (user_id, title, description, deadline) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, data.title, data.description, data.deadline]
    );
    res.status(201).json(goal.rows[0]);
  } catch (err) {
    next(err);
  }
});
 
// Read all
router.get('/', authenticate, async (req, res, next) => {
  try {
    const goals = await db.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(goals.rows);
  } catch (err) {
    next(err);
  }
});
 
// Update
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const data = GoalInput.partial().parse(req.body);

    const allowedFields = ['title', 'description', 'deadline'];

    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        values.push(data[field]);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields provided for update',
      });
    }

    const userId = req.user.id || req.user.userId;

    values.push(req.params.id);
    values.push(userId);

    const goalIdIndex = values.length - 1;
    const userIdIndex = values.length;

    const goal = await db.query(
      `
      UPDATE goals
      SET ${updates.join(', ')}
      WHERE id = $${goalIdIndex}
        AND user_id = $${userIdIndex}
      RETURNING *;
      `,
      values
    );

    if (!goal.rows.length) {
      return res.status(404).json({
        error: 'Goal not found',
      });
    }

    return res.json(goal.rows[0]);
  } catch (err) {
    return next(err);
  }
});
 
// Delete
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    // 1. Get all planned dates from tasks under this goal before deleting
    const taskDatesResult = await db.query(
      `SELECT DISTINCT planned_date
       FROM tasks
       WHERE goal_id = $1
       AND planned_date IS NOT NULL`,
      [req.params.id]
    );

    // 2. Delete the goal only if it belongs to the user
    const result = await db.query(
      `DELETE FROM goals
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // 3. Recalculate progress for affected weeks
    for (const row of taskDatesResult.rows) {
      await recalculateProgress(req.user.id, row.planned_date);
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
 
module.exports = router;
