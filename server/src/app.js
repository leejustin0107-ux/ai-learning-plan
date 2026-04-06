const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');

const app = express();
app.use(cors());
app.use(express.json());

// TODO: Tambahkan request logger middleware (modul Setup — Observability)

app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// TODO: Aktifkan setelah modul Scaffolding — Authentication & CRUD
// const authRoutes = require('./routes/auth');
// const goalRoutes = require('./routes/goals');
// app.use('/api/auth', authRoutes);
// app.use('/api/goals', goalRoutes);

// TODO: Aktifkan setelah modul Scaffolding — AI Stub & Quality Foundation
// const aiRoutes = require('./routes/ai');
// app.use('/api/ai', aiRoutes);

// TODO: Aktifkan setelah modul Cycle 1 — accept/reject flow
// const taskRoutes = require('./routes/tasks');
// app.use('/api/tasks', taskRoutes);

// TODO: Aktifkan setelah modul Cycle 2
// const progressRoutes = require('./routes/progress');
// app.use('/api/progress', progressRoutes);

// TODO: Tambahkan error handler di paling akhir (modul Scaffolding)

module.exports = app;
