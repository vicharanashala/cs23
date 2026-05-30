const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
    },

    submitterEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        'Application Setup',
        'Test & Coding Assessment',
        'Stipend & Offer Letters',
        'Internship Tasks',
      ],
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'closed'],
      default: 'pending',
      index: true,
    },

    adminNote: {
      type: String,
      default: null,
    },

    questionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index on trackingId for fast lookup
TicketSchema.index({ trackingId: 1 });

const Ticket = mongoose.model('Ticket', TicketSchema);

module.exports = Ticket;