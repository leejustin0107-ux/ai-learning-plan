const express = require('express');
const router = express.Router();

const db = require('../utils/db');
const authenticate = require('../middleware/authenticate');
const { getWeekString } = require('../utils/week');

function formatDateOnly(dateValue) {
  if (!dateValue) return null;

  if (typeof dateValue === 'string') {
    return dateValue.slice(0, 10);
  }

  return dateValue.toISOString().slice(0, 10);
}

function getWeekEndDate(weekStart) {
  const weekEnd = new Date(`${weekStart}T00:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd.toISOString().slice(0, 10);
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function escapeICalText(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatICalDateTime(date, slot) {
  const slotTimes = {
    morning: '090000',
    afternoon: '140000',
    evening: '190000',
  };

  const time = slotTimes[slot] || '090000';
  return `${date.replace(/-/g, '')}T${time}`;
}

function addMinutesToICalDateTime(date, slot, minutes = 60) {
  const slotHours = {
    morning: 9,
    afternoon: 14,
    evening: 19,
  };

  const start = new Date(`${date}T00:00:00`);
  start.setHours(slotHours[slot] || 9, 0, 0, 0);
  start.setMinutes(start.getMinutes() + Number(minutes || 60));

  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  const hour = String(start.getHours()).padStart(2, '0');
  const minute = String(start.getMinutes()).padStart(2, '0');

  return `${year}${month}${day}T${hour}${minute}00`;
}

function formatICalUtcDateTime(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function buildWeeklyICalendar({ weekStart, tasks }) {
  const exportedAt = formatICalUtcDateTime();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Learning Plan//Weekly Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:AI Learning Plan - Week ${weekStart}`,
  ];

  tasks.forEach((task) => {
    const plannedDate = formatDateOnly(task.planned_date);
    const startDateTime = formatICalDateTime(plannedDate, task.planned_slot);
    const endDateTime = addMinutesToICalDateTime(
      plannedDate,
      task.planned_slot,
      task.duration_estimate
    );

    const uid = `task-${task.id || task.title}-${plannedDate}@ai-learning-plan`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeICalText(uid)}`,
      `DTSTAMP:${exportedAt}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:${escapeICalText(task.title)}`,
      `DESCRIPTION:${escapeICalText(
        `Status: ${task.status || 'todo'}\\nSlot: ${
          task.planned_slot || 'morning'
        }\\nDuration: ${task.duration_estimate || 60} minutes`
      )}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  return `${lines.join('\r\n')}\r\n`;
}

async function getWeeklyExportData(userId, weekStart) {
  const weekEnd = getWeekEndDate(weekStart);

  const tasksResult = await db.query(
    `SELECT 
        t.id,
        t.title,
        t.description,
        t.planned_date,
        t.planned_slot,
        t.duration_estimate,
        t.status,
        g.title AS goal_title
     FROM tasks t
     JOIN goals g ON t.goal_id = g.id
     WHERE g.user_id = $1
     AND t.planned_date BETWEEN $2 AND $3
     ORDER BY t.planned_date, 
       CASE t.planned_slot
         WHEN 'morning' THEN 1
         WHEN 'afternoon' THEN 2
         WHEN 'evening' THEN 3
         ELSE 4
       END`,
    [userId, weekStart, weekEnd]
  );

  const week = getWeekString(weekStart);

  const progressResult = await db.query(
    `SELECT planned_hours, completed_hours, completion_rate
     FROM progress_snapshots
     WHERE user_id = $1 AND week = $2`,
    [userId, week]
  );

  const progress = progressResult.rows[0];

  return {
    week: weekStart,
    week_end: weekEnd,
    summary: {
      planned_hours: Number(progress?.planned_hours || 0),
      completed_hours: Number(progress?.completed_hours || 0),
      completion_rate: Number(progress?.completion_rate || 0),
    },
    tasks: tasksResult.rows,
    exported_at: new Date().toISOString(),
  };
}

router.get('/weekly', authenticate, async (req, res, next) => {
  try {
    const { week_start } = req.query;

    if (!week_start) {
      return res.status(400).json({
        error: 'Parameter week_start is required',
      });
    }

    if (!isValidDateString(week_start)) {
      return res.status(400).json({
        error: 'week_start must use YYYY-MM-DD format',
      });
    }

    const exportData = await getWeeklyExportData(req.user.id, week_start);

    res.json(exportData);
  } catch (err) {
    next(err);
  }
});

router.get('/weekly.ics', authenticate, async (req, res, next) => {
  try {
    const { week_start } = req.query;

    if (!week_start) {
      return res.status(400).json({
        error: 'Parameter week_start is required',
      });
    }

    if (!isValidDateString(week_start)) {
      return res.status(400).json({
        error: 'week_start must use YYYY-MM-DD format',
      });
    }

    const exportData = await getWeeklyExportData(req.user.id, week_start);
    const ics = buildWeeklyICalendar(exportData);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ai-learning-plan-${week_start}.ics"`
    );

    res.send(ics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;