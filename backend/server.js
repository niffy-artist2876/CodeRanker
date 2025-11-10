import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";

import integrationRoutes from "./routes/integrationRoutes.js";

import progressRoutes from "./routes/progressRoutes.js";

import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

// Initialize DB connection
connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
});

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// Set JSON and URL-encoded body size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Health endpoint
app.get("/api/health", (req, res) => {
  return res.json({ status: true, message: "ok" });
});

// Routes

app.use("/api/auth", authRoutes);

app.use("/api/integration", integrationRoutes);

app.use("/api/progress", progressRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
