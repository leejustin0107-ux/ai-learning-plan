// TODO: Implementasikan LLM service secara bertahap:
// 1. Setup (Observability): definisikan SuggestionSchema dan validateAIOutput
// 2. Scaffolding (AI Stub): tambahkan koneksi Gemini dan mock mode
// 3. Cycle 1: implementasikan callLLM penuh dengan konteks dari database

require('dotenv').config();
const { z } = require('zod');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');

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

// Validasi output AI — return null jika tidak valid
function validateAIOutput(raw) {
  try {
    const parsed = JSON.parse(raw);
    return SuggestionSchema.parse(parsed);
  } catch (error) {
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
  const userPrompt = `Type: ${type}\nContext: ${JSON.stringify(context)}`;
  const result = await model.generateContent([systemPrompt, userPrompt]);
  return result.response.text();
}
// Mock mode — hemat API quota, respons instan
async function callLLMMock(type, context) {
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
module.exports = { callLLM, validateAIOutput, SuggestionSchema, TaskSchema };