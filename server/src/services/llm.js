
require('dotenv').config();
const { z } = require('zod');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { aiRequestCount } = require('../utils/metrics');

// Schema untuk validasi output AI
const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  duration_estimate: z.number().min(25).max(90),
  planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  planned_slot: z.enum(['morning', 'afternoon', 'evening']),
  rationale: z.string().min(1),
});

const SuggestionSchema = z.object({
  tasks: z.array(TaskSchema).min(1),
  summary: z.string(),
});

const RescheduleOptionSchema = z.object({
  task_id: z.string().min(1),
  suggested_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  suggested_slot: z.enum(['morning', 'afternoon', 'evening']),
  rationale: z.array(z.string().min(1)).min(1),
});

const RescheduleSchema = z.object({
  options: z.array(RescheduleOptionSchema).min(1),
  summary: z.string().min(1),
});

function sanitizeContext(context) {
  const sanitized = JSON.parse(JSON.stringify(context));
  delete sanitized.email;
  delete sanitized.name;
  delete sanitized.phone;
  return sanitized;
}

// Validasi output AI — return null jika tidak valid
function validateAIOutput(raw) {
  try {
    let cleaned = raw.trim();

    cleaned = cleaned
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return SuggestionSchema.parse(parsed);
  } catch (error) {
    console.error('AI validation failed:', error.message);
    return null;
  }
}

function validateRescheduleOutput(raw, allowedTaskIds = []) {
  try {
    let cleaned = raw.trim();

    cleaned = cleaned
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    const validated = RescheduleSchema.parse(parsed);

    const filteredOptions = allowedTaskIds.length
      ? validated.options.filter((option) =>
          allowedTaskIds.includes(option.task_id)
        )
      : validated.options;

    if (filteredOptions.length === 0) {
      return null;
    }

    return {
      ...validated,
      options: filteredOptions,
    };
  } catch (error) {
    console.error('AI reschedule validation failed:', error.message);
    return null;
  }
}

// Load system prompt dari file
function loadSystemPrompt() {
  return fs.readFileSync(
    path.join(__dirname, '../prompts/system.md'),
    'utf-8'
  );
}

// Koneksi ke Gemini
const genAI = new GoogleGenerativeAI(config.geminiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
async function callLLMReal(type, context) {
  const systemPrompt = loadSystemPrompt();
  const safeContext = sanitizeContext(context);
  const userPrompt = `Type: ${type}\nContext: ${JSON.stringify(safeContext)}`;

  const start = Date.now();

  try {
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = result.response;
    const durationMs = Date.now() - start;

    const tokenUsage = {
      input_tokens: response.usageMetadata?.promptTokenCount || 0,
      output_tokens: response.usageMetadata?.candidatesTokenCount || 0,
    };

    aiRequestCount.inc({ type, status: 'success' });

    logger.info({
      action: 'llm_call',
      type,
      duration_ms: durationMs,
      ...tokenUsage,
    });

    return response.text();
  } catch (err) {
    aiRequestCount.inc({ type, status: 'error' });

    logger.error({
      action: 'llm_call_error',
      type,
      error_message: err.message,
      duration_ms: Date.now() - start,
    });

    if (err.message?.includes('503') || err.message?.includes('high demand')) {
      const serviceError = new Error(
        'AI service is temporarily busy. Please try again in a few moments.'
      );
      serviceError.statusCode = 503;
      throw serviceError;
    }

    throw err;
  }
}


// Mock mode — hemat API quota, respons instan
async function callLLMMock(type, context) {
  const safeContext = sanitizeContext(context);

  const plannedDate =
  safeContext.allowed_start_date ||
  safeContext.today ||
  new Date().toISOString().slice(0, 10);

  if (type === 'reschedule') {
    const task = safeContext.overdue_tasks?.[0];
    const startDate = safeContext.allowed_start_date || safeContext.today;

    return JSON.stringify({
      options: [
        {
          task_id: task?.id,
          suggested_date: startDate,
          suggested_slot: 'morning',
          rationale: [
            'Earliest available date after today.',
            'Morning slot keeps the task away from the previous overdue slot.',
            'Good option if the user wants to finish the task quickly.',
          ],
        },
        {
          task_id: task?.id,
          suggested_date: startDate,
          suggested_slot: 'afternoon',
          rationale: [
            'Keeps the task on the same day but gives more preparation time.',
            'Afternoon is a balanced option for a medium-duration task.',
            'Useful if the user cannot study in the morning.',
          ],
        },
        {
          task_id: task?.id,
          suggested_date: startDate,
          suggested_slot: 'evening',
          rationale: [
            'Evening slot is suitable if the user prefers later study sessions.',
            'Still avoids scheduling before today.',
            'Keeps the task realistic while reducing pressure.',
          ],
        },
      ],
      summary: 'Here are several possible reschedule options for the overdue task.',
    });
  }

  return JSON.stringify({
    tasks: [
      {
        title: 'Belajar React Hooks - useState dan useEffect',
        description: 'Pelajari dua hooks dasar React melalui dokumentasi resmi dan praktik langsung',
        duration_estimate: 45,
        planned_date: plannedDate,
        planned_slot: 'morning',
        rationale: 'Slot pagi tersedia, durasi 45 menit sesuai preferensi sesi pendek, hooks adalah fondasi untuk komponen selanjutnya',
      },
    ],
    summary: 'Rencana minggu ini fokus pada fondasi React hooks',
  });
}
const callLLM = config.llmProvider === 'mock' ? callLLMMock : callLLMReal;


module.exports = { callLLM, sanitizeContext, validateAIOutput, validateRescheduleOutput, SuggestionSchema, TaskSchema, RescheduleSchema, RescheduleOptionSchema, };