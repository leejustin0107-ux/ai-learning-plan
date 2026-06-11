
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

const RescheduleSchema = z.object({
  task_id: z.string().min(1),
  suggested_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  suggested_slot: z.enum(['morning', 'afternoon', 'evening']),
  reason: z.string().min(1),
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

    if (
      allowedTaskIds.length > 0 &&
      !allowedTaskIds.includes(validated.task_id)
    ) {
      return null;
    }

    return validated;
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

    throw err;
  }
}


// Mock mode — hemat API quota, respons instan
async function callLLMMock(type, context) {
  const safeContext = sanitizeContext(context);

  if (type === 'reschedule') {
    const task = context.overdue_tasks?.[0];

    return JSON.stringify({
      task_id: task?.id,
      suggested_date: safeContext.today,
      suggested_slot: 'morning',
      reason:
        'This overdue task is moved to the earliest available slot based on the current week schedule.',
    });
  }

  return JSON.stringify({
    tasks: [
      {
        title: 'Belajar React Hooks - useState dan useEffect',
        description: 'Pelajari dua hooks dasar React melalui dokumentasi resmi dan praktik langsung',
        duration_estimate: 45,
        planned_date: '2026-04-15',
        planned_slot: 'morning',
        rationale: 'Slot pagi tersedia, durasi 45 menit sesuai preferensi sesi pendek, hooks adalah fondasi untuk komponen selanjutnya',
      },
    ],
    summary: 'Rencana minggu ini fokus pada fondasi React hooks',
  });
}
const callLLM = config.llmProvider === 'mock' ? callLLMMock : callLLMReal;


module.exports = { callLLM, sanitizeContext, validateAIOutput, validateRescheduleOutput, SuggestionSchema, TaskSchema, RescheduleSchema, };