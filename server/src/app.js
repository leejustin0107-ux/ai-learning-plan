const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { aiLimiter, authLimiter } = require('./middleware/rateLimiter');
const aiRoutes = require('./routes/ai');
const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const tasksRoutes = require('./routes/tasks');
const progressRoutes = require('./routes/progress');
const exportRoutes = require('./routes/export');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.set('etag', false);
app.use(express.json());
app.use(requestLogger);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);
app.use('/api', tasksRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/export', exportRoutes);


app.use(errorHandler);



module.exports = app;
