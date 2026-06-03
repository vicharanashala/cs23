const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 300,
    },

    description: {
      type: String,
      required: true,
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

    submitterEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    status: {
      type: String,
      enum: ['pending', 'public_community', 'official_faq', 'rejected'],
      default: 'pending',
      index: true,
    },

    isOfficialFAQ: {
      type: Boolean,
      default: false,
      index: true,
    },

    upvotes: {
      type: Number,
      default: 0,
    },

    upvotedBy: [
      {
        type: String,
      },
    ],

    starRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },

    mediaUrls: [
      {
        type: String,
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    createdBy: {
      type: String,
      index: true,
    },

    ticketId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for full-text search on title + description
QuestionSchema.index({ title: 'text', description: 'text' });

// Index on status for filtered queries
QuestionSchema.index({ status: 1 });

// Index on isOfficialFAQ for promotion lookups
QuestionSchema.index({ isOfficialFAQ: 1 });

const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;