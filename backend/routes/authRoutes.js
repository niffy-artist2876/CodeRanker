import { Router } from "express";
import { loginHandler, meHandler, logoutHandler } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", loginHandler);
router.post("/logout", logoutHandler);
router.get("/me", asyncHandler(requireAuth), meHandler);

export default router;