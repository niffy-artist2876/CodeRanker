import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";

import {
  getLeetCodeStatsHandler,
  getCodeforcesStatsHandler,
  getIntegrationStatsHandler,
  getLinkedAccountsHandler,
  upsertLinkedAccountsHandler,
} from "../controllers/integrationController.js";

import { verifyLeetCodeUsername } from "../services/leetcodeService.js";
import { verifyCodeforcesHandle } from "../services/codeforcesService.js";

const router = Router();

/**
 * Integration routes:
 * - Link/unlink external handles to the currently logged-in user (by PESU email)
 * - Fetch LeetCode/Codeforces stats for linked accounts
 * - Verify prospective usernames/handles prior to linking
 *
 * All linked/stats routes are protected and operate on the logged-in user's profile.
 * Verification routes are also protected to avoid abuse.
 */

// Return currently linked handles for the authenticated user
router.get(
  "/linked",
  asyncHandler(requireAuth),
  asyncHandler(getLinkedAccountsHandler),
);

// Upsert linked handles for the authenticated user
router.put(
  "/linked",
  asyncHandler(requireAuth),
  asyncHandler(upsertLinkedAccountsHandler),
);

// Fetch LeetCode stats for the authenticated user's linked account
router.get(
  "/stats/leetcode",
  asyncHandler(requireAuth),
  asyncHandler(getLeetCodeStatsHandler),
);

// Fetch Codeforces stats for the authenticated user's linked account
router.get(
  "/stats/codeforces",
  asyncHandler(requireAuth),
  asyncHandler(getCodeforcesStatsHandler),
);

// Fetch both integrations' stats at once
router.get(
  "/stats",
  asyncHandler(requireAuth),
  asyncHandler(getIntegrationStatsHandler),
);

// Verify a LeetCode username exists (lightweight check)
router.get(
  "/verify/leetcode/:username",
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const username = String(req.params.username || "").trim();
    try {
      const exists = await verifyLeetCodeUsername(username);
      return res.json({
        ok: true,
        platform: "leetcode",
        username,
        exists,
      });
    } catch (err) {
      const message = err?.message || "Verification failed";
      const status = /invalid|format|length|required/i.test(message) ? 400 : 502;
      return res.status(status).json({
        ok: false,
        platform: "leetcode",
        username,
        message,
      });
    }
  }),
);

// Verify a Codeforces handle exists (lightweight check)
router.get(
  "/verify/codeforces/:handle",
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const handle = String(req.params.handle || "").trim();
    try {
      const exists = await verifyCodeforcesHandle(handle);
      return res.json({
        ok: true,
        platform: "codeforces",
        handle,
        exists,
      });
    } catch (err) {
      const message = err?.message || "Verification failed";
      const status = /invalid|format|length|required/i.test(message) ? 400 : 502;
      return res.status(status).json({
        ok: false,
        platform: "codeforces",
        handle,
        message,
      });
    }
  }),
);

export default router;
