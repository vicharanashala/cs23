const express = require('express');
const axios = require('axios');
const router = express.Router();

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000';

// ─── GET /api/search?q=... ─────────────────────────────────────────────────
// Keyword search (fast text matching)
router.get('/search', async (req, res) => {
  const { q, mode = 'keyword', limit = 10 } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'q (query) is required' });
  }

  try {
    if (mode === 'ai') {
      // AI (RAG) chat — returns answer string
      const response = await axios.post(
        `${RAG_API_URL}/chat`,
        { message: q.trim(), top_k: 3 },
        { timeout: 30000 }
      );
      return res.json({ mode: 'ai', answer: response.data.answer });
    }

    // Default: keyword search
    const response = await axios.post(
      `${RAG_API_URL}/search/keyword`,
      { query: q.trim(), limit: Math.min(20, Number(limit) || 10) },
      { timeout: 10000 }
    );
    res.json({ mode: 'keyword', results: response.data.results, total: response.data.total });
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data?.detail || 'Search service unavailable';
    console.error(`[search] RAG API error: ${detail}`);
    res.status(status).json({ error: detail });
  }
});

module.exports = router;