// models/passwordResetTokenModel.js
const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // 1 hour
  }
});

const PasswordResetTokenModel = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

module.exports = PasswordResetTokenModel;
