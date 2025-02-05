// models/passwordResetTokenModel.js
import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 31536000,
  },
});

const PasswordResetTokenModel = mongoose.model(
  "PasswordResetToken",
  passwordResetTokenSchema
);

export default PasswordResetTokenModel;
