// TODO: Implementasikan LLM service secara bertahap:
// 1. Setup (Observability): definisikan SuggestionSchema dan validateAIOutput
// 2. Scaffolding (AI Stub): tambahkan koneksi Gemini dan mock mode
// 3. Cycle 1: implementasikan callLLM penuh dengan konteks dari database

const { z } = require('zod');

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

// TODO: Implementasikan di modul Setup
function validateAIOutput(raw) {
  throw new Error('validateAIOutput belum diimplementasikan');
}

// TODO: Implementasikan di modul Scaffolding
async function callLLM(type, context) {
  throw new Error('callLLM belum diimplementasikan');
}

module.exports = { callLLM, validateAIOutput, SuggestionSchema, TaskSchema };
