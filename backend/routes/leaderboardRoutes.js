import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getLeaderboardHandler,
  getMyRankHandler,
} from "../controllers/leaderboardController.js";

/**
 * Leaderboard routes
 *
 * All endpoints are protected and require a valid session.
 *
 * GET /api/leaderboard
 *   Query:
 *     - limit?: number (default 100, max 500)
 *     - offset?: number (default 0, max 5000)
 *   Response: {
 *     ok: true,
 *     leaderboard: [...], // ranked entries
 *     weights: { lcWeight, cfWeight, cfBaseline },
 *     ...
 *   }
 *
 * GET /api/leaderboard/me
 *   Query:
 *     - window?: number (default 3, max 10) // surrounding context window
 *   Response: {
 *     ok: true,
 *     found: boolean,
 *     me?: entry,
 *     surrounding?: entry[]
 *   }
 */

const router = Router();

router.get(
  "/",
  asyncHandler(requireAuth),
  asyncHandler(getLeaderboardHandler),
);

router.get(
  "/me",
  asyncHandler(requireAuth),
  asyncHandler(getMyRankHandler),
);

export default router;
