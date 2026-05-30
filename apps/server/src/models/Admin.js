const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;