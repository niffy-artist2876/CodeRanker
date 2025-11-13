import mongoose from "mongoose";

const ScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  score: { type: Number, default: 0 }
}, { _id: false });

const ContestSchema = new mongoose.Schema({
  title: String,
  date: Date,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  scores: [ScoreSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Contest", ContestSchema);
