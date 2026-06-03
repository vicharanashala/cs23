const express = require('express');
const Question = require('../models/Question');
const Rating = require('../models/Rating');
const SearchLog = require('../models/SearchLog');
const ApiError = require('../utils/ApiError');
const { searchFaqs } = require('../utils/bm25');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/faqs
// Query: category, search, type (official|community|all), page (default 1),
//        limit (default 20)
// - Logs to SearchLog if search term present and length >= 3
// - Returns: { faqs: [...], total, page, totalPages }
// ---------------------------------------------------------------------------
router.get('/faqs', async (req, res) => {
  const { category, search, type = 'official', page = 1, limit = 20 } = req.query;

  const filter = {};

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Type filter → status values
  if (type === 'official') {
    filter.status = 'official_faq';
  } else if (type === 'community') {
    filter.status = 'public_community';
  }
  // 'all' → no status filter

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  let faqs;
  let total;

  // BM25 ranking when search term present (length >= 3)
  if (search && search.trim().length >= 3) {
    const trimmed = search.trim();
    const result = await searchFaqs(trimmed, filter, { limit: limitNum, skip });
    faqs = result.faqs;
    total = result.total;

    // Log searches for content gap analysis
    await SearchLog.create({
      query: trimmed,
      resultsCount: total,
      sessionId: req.headers['x-session-id'] || null,
    });
  } else {
    // Normal paginated listing — no ranking needed
    faqs = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    total = await Question.countDocuments(filter);
  }

  res.json({
    faqs,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// ---------------------------------------------------------------------------
// GET /api/faqs/trending
// Returns the single most-upvoted public question in the last 24 hours.
// Falls back to all-time most upvoted if no 24h activity exists.
// ---------------------------------------------------------------------------
router.get('/faqs/trending', async (req, res) => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recent = await Question.findOne({
    status: { $in: ['public_community', 'official_faq'] },
    createdAt: { $gte: cutoff },
  })
    .sort({ upvotes: -1 })
    .lean();

  if (recent) {
    return res.json(recent);
  }

  // Fallback: all-time most upvoted
  const allTime = await Question.findOne({
    status: { $in: ['public_community', 'official_faq'] },
  })
    .sort({ upvotes: -1 })
    .lean();

  res.json(allTime || null);
});

// ---------------------------------------------------------------------------
// GET /api/faqs/search/similar
// Query param: title (minimum 3 chars)
// Uses MongoDB $text search on title field
// Returns top 3 matches: [{ _id, title, status, upvotes }]
// ---------------------------------------------------------------------------
router.get('/faqs/search/similar', async (req, res) => {
  const { title } = req.query;

  if (!title || title.trim().length < 3) {
    return res.json({ results: [] });
  }

  const matches = await Question.find(
    { $text: { $search: title.trim() } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(3)
    .select('_id title status upvotes')
    .lean();

  res.json({ results: matches });
});

// ---------------------------------------------------------------------------
// GET /api/faqs/:id
// Returns a single question by its _id with all fields.
// ---------------------------------------------------------------------------
router.get('/faqs/:id', async (req, res) => {
  const faq = await Question.findById(req.params.id).lean();
  if (!faq) {
    throw new ApiError(404, 'FAQ not found');
  }
  res.json(faq);
});

// ---------------------------------------------------------------------------
// GET /api/faqs/mine
// Query: sessionId — returns submitted questions and upvoted questions for that user.
// ----------------------------------------------------------------------------
router.get('/faqs/mine', async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    throw new ApiError(400, 'sessionId is required');
  }

  const [submitted, upvotedQuestions] = await Promise.all([
    Question.find({ createdBy: sessionId }).sort({ createdAt: -1 }).lean(),
    Question.find({ upvotedBy: sessionId }).sort({ upvotes: -1 }).lean(),
  ]);

  res.json({ submitted, upvotedQuestions });
});

// ---------------------------------------------------------------------------
// POST /api/faqs/:id/upvote
// Body: { sessionId }
// Prevent double-voting. Auto-promote to official_faq at 15 upvotes.
// Returns: { upvotes, promoted }
// ---------------------------------------------------------------------------
router.post('/faqs/:id/upvote', async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    throw new ApiError(400, 'sessionId is required');
  }

  const faq = await Question.findById(req.params.id);
  if (!faq) {
    throw new ApiError(404, 'FAQ not found');
  }

  // Reject if already upvoted by this session
  if (faq.upvotedBy.includes(sessionId)) {
    throw new ApiError(409, 'Already upvoted');
  }

  // Apply upvote
  faq.upvotes += 1;
  faq.upvotedBy.push(sessionId);

  // Auto-promotion: >= 15 upvotes + still in community → promote
  const wasCommunity = faq.status === 'public_community';
  const promoted = wasCommunity && faq.upvotes >= 15;

  if (promoted) {
    faq.status = 'official_faq';
    faq.isOfficialFAQ = true;
  }

  await faq.save();

  res.json({ upvotes: faq.upvotes, promoted });
});

// ---------------------------------------------------------------------------
// POST /api/faqs/:id/rate
// Body: { sessionId, stars } — stars must be integer 1-5
// Upserts Rating (unique: questionId + sessionId).
// Recalculates question starRating (average) and ratingCount.
// Returns: { starRating, ratingCount }
// ---------------------------------------------------------------------------
router.post('/faqs/:id/rate', async (req, res) => {
  const { sessionId, stars } = req.body;

  if (!sessionId) {
    throw new ApiError(400, 'sessionId is required');
  }

  const starsNum = parseInt(stars, 10);
  if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
    throw new ApiError(400, 'stars must be an integer between 1 and 5');
  }

  const faq = await Question.findById(req.params.id);
  if (!faq) {
    throw new ApiError(404, 'FAQ not found');
  }

  // Upsert rating — one rating per question per session
  await Rating.findOneAndUpdate(
    { questionId: faq._id, sessionId },
    { stars: starsNum },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Recalculate aggregate starRating and ratingCount
  const agg = await Rating.aggregate([
    { $match: { questionId: faq._id } },
    { $group: { _id: null, avgStars: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]);

  const avgStars = agg[0] ? agg[0].avgStars : 0;
  const ratingCount = agg[0] ? agg[0].count : 0;

  faq.starRating = Math.round(avgStars * 10) / 10;
  faq.ratingCount = ratingCount;
  await faq.save();

  res.json({ starRating: faq.starRating, ratingCount: faq.ratingCount });
});

module.exports = router;