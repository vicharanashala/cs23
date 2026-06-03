const express = require('express');
const axios = require('axios');
const router = express.Router();

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000';

router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const response = await axios.post(
      `${RAG_API_URL}/chat`,
      { message: message.trim(), top_k: 3 },
      { timeout: 30000 }
    );
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data?.detail || 'Chat service unavailable';
    console.error(`[chat] RAG API error: ${detail}`);
    res.status(status).json({ error: detail });
  }
});

module.exports = router;