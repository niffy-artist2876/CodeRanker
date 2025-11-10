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


router.get(
  "/linked",
  asyncHandler(requireAuth),
  asyncHandler(getLinkedAccountsHandler),
);

router.put(
  "/linked",
  asyncHandler(requireAuth),
  asyncHandler(upsertLinkedAccountsHandler),
);

router.get(
  "/stats/leetcode",
  asyncHandler(requireAuth),
  asyncHandler(getLeetCodeStatsHandler),
);

router.get(
  "/stats/codeforces",
  asyncHandler(requireAuth),
  asyncHandler(getCodeforcesStatsHandler),
);

router.get(
  "/stats",
  asyncHandler(requireAuth),
  asyncHandler(getIntegrationStatsHandler),
);

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
