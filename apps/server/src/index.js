require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'FAQ Platform API is healthy', timestamp: new Date().toISOString() });
});

// Placeholder routes (to be implemented)
app.get('/api', (req, res) => {
  res.json({ success: true, name: 'FAQ Platform API', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.log(`✅ FAQ Platform API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;