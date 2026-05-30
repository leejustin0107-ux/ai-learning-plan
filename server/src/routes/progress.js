const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const authenticate = require('../middleware/authenticate');
 
router.get('/weekly', authenticate, async (req, res, next) => {
  try {
    const { week } = req.query; // format: 2026-W15
 
    if (!week) {
      return res.status(400).json({ error: 'Parameter week diperlukan (format: YYYY-Wxx)' });
    }
 
    const result = await db.query(
      'SELECT * FROM progress_snapshots WHERE user_id = $1 AND week = $2',
      [req.user.id, week]
    );
 
    if (!result.rows.length) {
      return res.json({ week, planned_hours: 0, completed_hours: 0, completion_rate: 0 });
    }
 
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});
 
module.exports = router;
