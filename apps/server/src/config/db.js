const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

// Reuse connection across warm invocations (Vercel serverless)
let cached = global.__mongoose;
if (!cached) {
  cached = global.__mongoose = { conn: null, promise: null };
}

function buildUri(uri) {
  // Append connection timeout params if not already present
  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}connectTimeoutMS=10000&serverSelectionTimeoutMS=10000&socketTimeoutMS=30000`;
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = buildUri(MONGODB_URI);
    cached.promise = mongoose.connect(uri, { maxPoolSize: 1 }).then((m) => {
      cached.conn = m;
      return m;
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  return cached.promise;
}

module.exports = connectDB;