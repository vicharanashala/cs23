const mongoose = require('mongoose');

const SearchLogSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    resultsCount: {
      type: Number,
      required: true,
      default: 0,
    },

    sessionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — documents auto-expire 30 days after createdAt
SearchLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const SearchLog = mongoose.model('SearchLog', SearchLogSchema);

module.exports = SearchLog;