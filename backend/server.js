const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase first (before any routes)
require('./config/firebase');

const app = express();

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
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
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body));
  }
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const expensesRoutes = require('./routes/expenses');
const checkinsRoutes = require('./routes/checkins');
const documentsRoutes = require('./routes/documents');
const notesRoutes = require('./routes/notes');
const placesRoutes = require('./routes/places');
const alertsRoutes = require('./routes/alerts');
const searchRoutes = require('./routes/search');
const habitsRoutes = require('./routes/habits');
const upgradesRoutes = require('./routes/upgrades');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/checkins', checkinsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/upgrades', upgradesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'Firebase Firestore', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔥 Database: Firebase Firestore`);
  console.log(`📱 Access from network: http://YOUR_IP:${PORT}`);
});
