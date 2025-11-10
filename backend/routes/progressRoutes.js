import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getProgressOverviewHandler,
  getPlatformProgressHandler,
} from "../controllers/progressController.js";

const router = Router();

router.get(
  "/overview",
  asyncHandler(requireAuth),
  asyncHandler(getProgressOverviewHandler),
);

router.get(
  "/:platform",
  asyncHandler(requireAuth),
  asyncHandler(getPlatformProgressHandler),
);

export default router;
