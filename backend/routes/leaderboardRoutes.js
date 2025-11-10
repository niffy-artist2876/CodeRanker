import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getLeaderboardHandler,
  getMyRankHandler,
} from "../controllers/leaderboardController.js";


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
