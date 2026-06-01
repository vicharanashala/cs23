const express = require('express');
const { z } = require('zod');
const { nanoid } = require('nanoid');
const Ticket = require('../models/Ticket');
const ApiError = require('../utils/ApiError');
const { categorize } = require('../utils/tfidf');

const router = express.Router();

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const CATEGORIES = [
  'Application Setup',
  'Test & Coding Assessment',
  'Stipend & Offer Letters',
  'Internship Tasks',
];

const SubmitTicketSchema = z.object({
  email: z.string().email('Invalid email address'),
  category: z.string().refine((v) => CATEGORIES.includes(v), {
    message: `category must be one of: ${CATEGORIES.join(', ')}`,
  }),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

// ---------------------------------------------------------------------------
// POST /api/tickets
// Generate: TKT-{YYYY}-{8 uppercase alphanumeric}
// nanoid alphabet: uppercase A-Z + digits 2-9 (no confusing 0/O, 1/I)
// ---------------------------------------------------------------------------
router.post('/tickets', async (req, res) => {
  const parsed = SubmitTicketSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  const { email, category, description } = parsed.data;

  // Build a human-readable subject from description (first 60 chars)
  const subject = description.length > 60 ? description.slice(0, 60) + '…' : description;

  // Generate tracking ID: TKT-2026-A3X9B2QR
  const year = new Date().getFullYear();
  const suffix = nanoid(8).toUpperCase();
  const trackingId = `TKT-${year}-${suffix}`;

  // TF-IDF auto-categorization (based on email + description text)
  const suggestedCategory = categorize(`${email} ${description}`);

  const ticket = await Ticket.create({
    trackingId,
    submitterEmail: email,
    category,
    description,
    status: 'pending',
    history: [{ status: 'pending', changedAt: new Date(), note: 'Submitted' }],
  });

  const response = {
    success: true,
    trackingId,
    message: 'Ticket submitted successfully',
  };

  if (suggestedCategory) {
    response.suggestedCategory = suggestedCategory;
  }

  res.status(201).json(response);
});

// ---------------------------------------------------------------------------
// GET /api/tickets/:trackingId
// Lookup by trackingId field (not _id)
// ---------------------------------------------------------------------------
router.get('/tickets/:trackingId', async (req, res) => {
  const ticket = await Ticket.findOne({ trackingId: req.params.trackingId }).lean();

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  res.json({
    trackingId: ticket.trackingId,
    subject: ticket.description.slice(0, 60) + (ticket.description.length > 60 ? '…' : ''),
    status: ticket.status,
    category: ticket.category,
    description: ticket.description,
    adminNote: ticket.adminNote,
    history: ticket.history,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  });
});

module.exports = router;