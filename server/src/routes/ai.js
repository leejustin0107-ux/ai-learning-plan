const { z } = require('zod');
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const authenticate = require('../middleware/authenticate');
const { callLLM, validateAIOutput, validateRescheduleOutput, } = require('../services/llm');
const logger = require('../utils/logger');
const Goal = require('../models/Goal');
const Profile = require('../models/Profile');
const Task = require('../models/Task');
const AIRecommendation = require('../models/AIRecomendation');
const { findOverdueTasks, findTasksByWeek, findTasksByIds } = require('../services/tasks');
const { getCurrentWeekStart, getCurrentWeek, getWeekEnd, formatLocalDate } = require('../utils/week');

const SuggestInput = z.object({
  goal_id: z.string().uuid(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function filterValidRescheduleOptions(recommendation, overdueTasks, today) {
  if (!recommendation || !Array.isArray(recommendation.options)) {
    return null;
  }

  const validOptions = recommendation.options.filter((option) => {
    const task = overdueTasks.find((item) => item.id === option.task_id);

    if (!task) return false;

    const goalDeadline = task.goal_deadline
      ? formatLocalDate(task.goal_deadline)
      : null;

    if (option.suggested_date < today) {
      return false;
    }

    if (goalDeadline && option.suggested_date > goalDeadline) {
      return false;
    }

    return true;
  });

  if (validOptions.length === 0) {
    return null;
  }

  return {
    ...recommendation,
    options: validOptions,
  };
}

function validateSuggestionDateRange(suggestion, allowedStart, allowedEnd) {
  if (!suggestion || !Array.isArray(suggestion.tasks)) {
    return null;
  }

  const validTasks = suggestion.tasks.filter((task) => {
    return (
      task.planned_date >= allowedStart &&
      task.planned_date <= allowedEnd
    );
  });

  if (validTasks.length === 0) {
    return null;
  }

  return {
    ...suggestion,
    tasks: validTasks,
  };
}
 
router.post('/plan/suggest', authenticate, async (req, res, next) => {
  try {
    const input = SuggestInput.parse(req.body);

    //ambil context dari database
    const goal = await Goal.findByIdForUser(input.goal_id, req.user.id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const profile = await Profile.findByUserId(req.user.id);
    const existingTasks = await Task.findByWeekForUser(req.user.id, input.week_start);

    const today = formatLocalDate(new Date());
    const weekEnd = getWeekEnd(input.week_start);
    const goalDeadline = goal.deadline ? formatLocalDate(goal.deadline) : null;

    const allowedStart = input.week_start < today ? today : input.week_start;
    const allowedEnd = goalDeadline && goalDeadline < weekEnd
      ? goalDeadline
      : weekEnd;

    if (goalDeadline && goalDeadline < today) {
      return res.status(400).json({
        error: 'Goal deadline has already passed. Please update the goal deadline before generating AI suggestions.',
      });
    }

    if (allowedEnd < allowedStart) {
      return res.status(400).json({
        error: 'No valid dates are available for this week. Please choose another week or update the goal deadline.',
      });
    }

    const context = {
      today,
      week_start: input.week_start,
      week_end: weekEnd,
      allowed_start_date: allowedStart,
      allowed_end_date: allowedEnd,
      date_rules: [
        `Do not suggest any task before ${allowedStart}.`,
        `Do not suggest any task after ${allowedEnd}.`,
        'All task planned_date values must be inside the allowed date range.',
      ],
      goal: {
        title: goal.title,
        description: goal.description,
        deadline: goalDeadline,
      },
      availability: profile?.availability || {},
      weekly_target_hours: profile?.weekly_target_hours || 5,
      preferred_time: profile?.preferred_time || 'evening',
      existing_tasks: existingTasks.map((task) => ({
        title: task.title,
        planned_date: formatLocalDate(task.planned_date),
        planned_slot: task.planned_slot,
      })),
    };

    const raw = await callLLM('suggest', context);

    const validated = validateSuggestionDateRange(
      validateAIOutput(raw),
      allowedStart,
      allowedEnd
    );
    
    if (!validated) {
      //retry
      const retry = await callLLM('suggest', context);

      const retryValidated = validateSuggestionDateRange(
        validateAIOutput(retry),
        allowedStart,
        allowedEnd
      );
      if (!retryValidated) {
        logger.warn({ request_id: req.requestId, action: 'ai_suggest_failed'});
        return res.status(422).json({
          error: 'AI tidak dapat memberikan saran yang valid. Coba lagi nanti',
        });
      }
      return res.json(retryValidated);
    }

    //simpan rekomendasi untuk audit
    await AIRecommendation.create({
      user_id: req.user.id,
      type:'suggest',
      input_context: context,
      output: validated,
    });
 
    res.json(validated);
  } catch (err) {
    console.error('POST /api/ai/plan/suggest error:', err);
    next(err);
  }
});

router.post('/plan/reschedule', authenticate, async (req, res, next) => {
  try {
    const { task_ids } = req.body;

    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({
        error: 'task_ids must be a non-empty array',
      });
    }

    const overdueTasks = await findTasksByIds(req.user.id, task_ids);

    if (!overdueTasks.length) {
      return res.status(404).json({
        error: 'No matching tasks found',
      });
    }

    const today = formatLocalDate(new Date());
    const weekStart = getCurrentWeekStart();
    const weekEnd = getWeekEnd(weekStart);
    const week = getCurrentWeek();

    const weekTasks = await findTasksByWeek(req.user.id, weekStart);

    const profileResult = await db.query(
      `SELECT availability, weekly_target_hours
       FROM profiles
       WHERE user_id = $1`,
      [req.user.id]
    );

    const profile = profileResult.rows[0];

    const progressResult = await db.query(
      `SELECT *
       FROM progress_snapshots
       WHERE user_id = $1 AND week = $2`,
      [req.user.id, week]
    );

    const progress = progressResult.rows[0];

    const context = {
      today,
      allowed_start_date: today,
      allowed_end_date: weekEnd,
      date_rules: [
        `Do not suggest any reschedule date before ${today}.`,
        'Do not suggest a date after the related goal deadline.',
        'Return multiple reschedule options with rationale bullet points.',
      ],

      overdue_tasks: overdueTasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        duration_estimate: task.duration_estimate,
        original_date: formatLocalDate(task.planned_date),
        original_slot: task.planned_slot,
        goal_title: task.goal_title,
        goal_deadline: task.goal_deadline
          ? formatLocalDate(task.goal_deadline)
          : null,
      })),

      current_week_tasks: weekTasks
        .filter((task) => task.status === 'todo')
        .map((task) => ({
          id: task.id,
          title: task.title,
          planned_date: task.planned_date,
          planned_slot: task.planned_slot,
          duration_estimate: task.duration_estimate,
        })),

      availability: profile?.availability || {},
      remaining_capacity:
        (profile?.weekly_target_hours || 5) -
        (progress?.completed_hours || 0),
    };

    const raw = await callLLM('reschedule', context);
    const validated = filterValidRescheduleOptions(
      validateRescheduleOutput(raw, task_ids),
      overdueTasks,
      today
    );

    if (!validated) {
      const retry = await callLLM('reschedule', context);
      const retryValidated = filterValidRescheduleOptions(
        validateRescheduleOutput(retry, task_ids),
        overdueTasks,
        today
      );

      if (!retryValidated) {
        logger.warn({
          request_id: req.requestId,
          action: 'ai_reschedule_failed',
        });

        return res.status(422).json({
        error: 'AI could not create a valid reschedule suggestion. Try again later.',
        });
      }

      await AIRecommendation.create({
        user_id: req.user.id,
        type: 'reschedule',
        input_context: context,
        output: retryValidated,
      });

      return res.json({
        recommendation: retryValidated,
      });
    }

    await AIRecommendation.create({
      user_id: req.user.id,
      type: 'reschedule',
      input_context: context,
      output: validated,
    });

    res.json({
      recommendation: validated,
    });
  } catch (err) {
    next(err);
  }
});
 
module.exports = router;