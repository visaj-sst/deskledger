import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    userId: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phoneNo: {
      type: Number,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    is_admin: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },
    profileImage: {
      type: String,
      default: "",
      required: false,
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
