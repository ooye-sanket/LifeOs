const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase first (before any routes)
require('./config/firebase');

const app = express();

// CORS Configuration - allows your Vercel frontend + local dev
const allowedOrigins = [
  process.env.FRONTEND_URL,        // your Vercel URL e.g. https://lifeos.vercel.app
  'http://localhost:3000',          // local React dev
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman, mobile, etc.
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In dev/Lambda allow all
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
const authRoutes      = require('./routes/auth');
const tasksRoutes     = require('./routes/tasks');
const expensesRoutes  = require('./routes/expenses');
const checkinsRoutes  = require('./routes/checkins');
const documentsRoutes = require('./routes/documents');
const notesRoutes     = require('./routes/notes');
const placesRoutes    = require('./routes/places');
const alertsRoutes    = require('./routes/alerts');
const searchRoutes    = require('./routes/search');
const habitsRoutes    = require('./routes/habits');
const upgradesRoutes  = require('./routes/upgrades');

app.use('/api/auth',      authRoutes);
app.use('/api/tasks',     tasksRoutes);
app.use('/api/expenses',  expensesRoutes);
app.use('/api/checkins',  checkinsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/notes',     notesRoutes);
app.use('/api/places',    placesRoutes);
app.use('/api/alerts',    alertsRoutes);
app.use('/api/search',    searchRoutes);
app.use('/api/habits',    habitsRoutes);
app.use('/api/upgrades',  upgradesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: 'Firebase Firestore',
    environment: process.env.IS_LAMBDA ? 'lambda' : 'local',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// ─── LOCAL DEV: start normally ───────────────────────────────────────────────
if (!process.env.IS_LAMBDA) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🔥 Database: Firebase Firestore`);
  });
}

// ─── AWS LAMBDA: export handler ──────────────────────────────────────────────
const serverless = require('serverless-http');
module.exports.handler = serverless(app);
