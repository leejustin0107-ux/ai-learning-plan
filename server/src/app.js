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

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);


app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);
app.use('/api', tasksRoutes);
app.use('/api/progress', progressRoutes);

// TODO: Aktifkan setelah modul Cycle 2
// const progressRoutes = require('./routes/progress');
// app.use('/api/progress', progressRoutes);

// TODO: Tambahkan error handler di paling akhir (modul Scaffolding)
app.use(errorHandler);


module.exports = app;
