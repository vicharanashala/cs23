// FIRST — enable express-async-errors before anything else
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PORT, CLIENT_URL, ADMIN_URL } = require('./config/env');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const healthRouter = require('./routes/health');
const faqRouter = require('./routes/faq.routes');
const ticketRouter = require('./routes/ticket.routes');
const adminRouter = require('./routes/admin.routes');
const chatRouter = require('./routes/chat.routes');
const searchRouter = require('./routes/search.routes');

const app = express();


// Security & logging middleware (in order)
app.use(helmet());
app.use(logger);

// CORS — allow both the web client and admin portal
app.use(
  cors({
    origin: [CLIENT_URL, ADMIN_URL],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api', faqRouter);
app.use('/api', ticketRouter);
app.use('/api', adminRouter);
app.use('/api', chatRouter);
app.use('/api', searchRouter);

app.get('/api', (req, res) => {
  res.json({ success: true, name: 'FAQ Platform API', version: '0.1.0' });
});

// GLOBAL ERROR HANDLER — must be last
app.use(errorHandler);

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ FAQ Platform API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
});

module.exports = app;