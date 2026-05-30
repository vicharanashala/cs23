const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
    },

    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index — one rating per question per session
RatingSchema.index({ questionId: 1, sessionId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', RatingSchema);

module.exports = Rating;