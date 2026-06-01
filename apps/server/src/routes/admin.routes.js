const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const Question = require('../models/Question');
const Ticket = require('../models/Ticket');
const SearchLog = require('../models/SearchLog');
const Admin = require('../models/Admin');
const { verifyAdmin, signAdminToken } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// ---------------------------------------------------------------------------
// Rate limiter for login route: 10 attempts per 15 minutes per IP
// ---------------------------------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts — try again in 15 minutes' },
});

// ---------------------------------------------------------------------------
// POST /api/admin/login — NOT protected, rate-limited
// ---------------------------------------------------------------------------
router.post('/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    throw new ApiError(400, 'username and password are required');
  }

  const admin = await Admin.findOne({ username: username.toLowerCase().trim() });

  if (!admin) {
    // Generic message — don't reveal which field is wrong
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);

  if (!valid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = signAdminToken(admin);

  res.json({
    success: true,
    token,
    admin: {
      username: admin.username,
      role: admin.role,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/tickets — protected
// Query: status, page (default 1), limit (default 20)
// Sorted by createdAt desc
// ---------------------------------------------------------------------------
router.get('/admin/tickets', verifyAdmin, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('_id trackingId submitterEmail category status createdAt adminNote')
      .lean(),
    Ticket.countDocuments(query),
  ]);

  res.json({
    tickets,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/tickets/:id — protected
// Body: { status?, adminNote? }
// Append to history on status change
// ---------------------------------------------------------------------------
const TicketStatusSchema = z.object({
  status: z.enum(['pending', 'under_review', 'resolved', 'closed']).optional(),
  adminNote: z.string().optional(),
});

router.patch('/admin/tickets/:id', verifyAdmin, async (req, res) => {
  const parsed = TicketStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.message);
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  // Ensure history array exists (tickets created before this field was added)
  if (!ticket.history) ticket.history = [];

  if (parsed.data.status) {
    ticket.status = parsed.data.status;
    ticket.history.push({
      status: parsed.data.status,
      changedAt: new Date(),
      note: parsed.data.adminNote || null,
    });
  }

  if (parsed.data.adminNote !== undefined) {
    ticket.adminNote = parsed.data.adminNote;
  }

  await ticket.save();

  res.json({ ticket });
});

// ---------------------------------------------------------------------------
// GET /api/admin/questions/pending — protected
// Returns all pending questions sorted by createdAt desc
// ---------------------------------------------------------------------------
router.get('/admin/questions/pending', verifyAdmin, async (req, res) => {
  const questions = await Question.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ questions });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/questions/:id/approve — protected
// Body: { tags? (optional string array) }
// Set status: "public_community"
// ---------------------------------------------------------------------------
router.patch('/admin/questions/:id/approve', verifyAdmin, async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  question.status = 'public_community';

  if (Array.isArray(req.body.tags)) {
    question.tags = req.body.tags.map((t) => t.toLowerCase().trim());
  }

  await question.save();

  res.json({ question });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/questions/:id/reject — protected
// Set status: "rejected"
// ---------------------------------------------------------------------------
router.patch('/admin/questions/:id/reject', verifyAdmin, async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  question.status = 'rejected';
  await question.save();

  res.json({ question });
});

// ---------------------------------------------------------------------------
// GET /api/admin/content-gaps — protected (Innovation C)
// Query: days (default 30)
// ---------------------------------------------------------------------------
router.get('/admin/content-gaps', verifyAdmin, async (req, res) => {
  const days = Math.max(1, parseInt(req.query.days, 10) || 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [zeroResultAgg, poorRatingAgg] = await Promise.all([
    // Zero-result searches from SearchLog
    SearchLog.aggregate([
      { $match: { resultsCount: 0, createdAt: { $gte: since } } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
      { $project: { _id: 0, term: '$_id', count: 1 } },
    ]),

    // Poorly rated content: starRating > 0 AND starRating < 3
    Question.find({
      starRating: { $gt: 0, $lt: 3 },
    })
      .sort({ starRating: 1 })
      .limit(50)
      .select('_id title category starRating ratingCount')
      .lean(),
  ]);

  res.json({
    zeroResultSearches: zeroResultAgg,
    poorlyRatedContent: poorRatingAgg,
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/notifications/count — protected
// Returns badge counts for pending tickets + questions
// ---------------------------------------------------------------------------
router.get('/admin/notifications/count', verifyAdmin, async (req, res) => {
  const [pendingTickets, pendingQuestions] = await Promise.all([
    Ticket.countDocuments({ status: 'pending' }),
    Question.countDocuments({ status: 'pending' }),
  ]);

  res.json({ pendingTickets, pendingQuestions });
});

module.exports = router;