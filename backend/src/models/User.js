import mongoose from "mongoose";

const CodeforcesStatsSchema = new mongoose.Schema({
  rating: Number,
  rank: String,
  maxRating: Number,
  maxRank: String
}, { _id: false });

const LeetCodeStatsSchema = new mongoose.Schema({
  totalSolved: Number,
  easySolved: Number,
  mediumSolved: Number,
  hardSolved: Number,
  ranking: Number
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  srn: { type: String, unique: true },
  role: { type: String, enum: ["user","admin"], default: "user" },
  codeforcesHandle: String,
  leetcodeHandle: String,
  codeforcesStats: CodeforcesStatsSchema,
  leetcodeStats: LeetCodeStatsSchema
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
