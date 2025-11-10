import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getProgressOverviewHandler,
  getPlatformProgressHandler,
} from "../controllers/progressController.js";

const router = Router();

// Overview progress across platforms for the authenticated user
router.get(
  "/overview",
  asyncHandler(requireAuth),
  asyncHandler(getProgressOverviewHandler),
);

// Platform-specific progress: 'leetcode' | 'codeforces'
router.get(
  "/:platform",
  asyncHandler(requireAuth),
  asyncHandler(getPlatformProgressHandler),
);

export default router;
