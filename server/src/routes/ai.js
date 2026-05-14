const { z } = require('zod');
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { callLLM, validateAIOutput } = require('../services/llm');
const logger = require('../utils/logger');
const Goal = require('../models/Goal');
const Profile = require('../models/Profile');
const Task = require('../models/Task');
const AIRecommendation = require('../models/AIRecomendation');

const SuggestInput = z.object({
  goal_id: z.string().uuid(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
 
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

    const context = {
      goal: { title: goal.title, description: goal.description, deadline: goal.deadline },
      availability: profile.availability,
      weekly_target_hours: profile.weekly_target_hours,
      preferred_time: profile.preferred_time,
      existing_tasks: existingTasks.map(t => ({
        title: t.title,
        planned_date: t.planned_date,
        planned_slot: t.planned_slot,
      })),
    };

    const raw = await callLLM('suggest', context);

    const validated = validateAIOutput(raw);
 
    if (!validated) {
      //retry
      const retry = await callLLM('suggest', context);

      const retryValidated = validateAIOutput(retry);
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
 
module.exports = router;