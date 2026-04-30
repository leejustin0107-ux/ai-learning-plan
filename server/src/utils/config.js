// TODO: Implementasikan validasi environment variables.
// Lihat modul Setup — sub modul "Tech Stack, Project Structure & Environment".
require('dotenv').config();
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env: ${key}`);
    process.exit(1);
  }
}
module.exports = {
  db: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  llmProvider: process.env.LLM_PROVIDER || 'gemini',
  geminiKey: process.env.GEMINI_API_KEY,
  port: process.env.PORT || 3000,
};