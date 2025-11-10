import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  leetcodeUsername: {
    type: String,
    default: null,
    trim: true,
  },
  codeforcesHandle: {
    type: String,
    default: null,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent model overwrite issues in dev/hot-reload
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
