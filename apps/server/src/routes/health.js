const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * GET /api/health
 * Returns server health including database connection state.
 * dbState values: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState,
  });
});

module.exports = router;