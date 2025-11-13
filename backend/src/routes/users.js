import { Router } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchCodeforces, fetchLeetCode } from "../utils/stats.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const me = await User.findById(req.userId);
  if (!me) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, user: me });
});

router.put("/me/handles", requireAuth, async (req, res) => {
  try {
    const { codeforcesHandle, leetcodeHandle } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (codeforcesHandle !== undefined) user.codeforcesHandle = codeforcesHandle?.trim() || null;
    if (leetcodeHandle !== undefined) user.leetcodeHandle = leetcodeHandle?.trim() || null;

    // Immediately fetch stats (best-effort)
    if (user.codeforcesHandle) {
      user.codeforcesStats = await fetchCodeforces(user.codeforcesHandle).catch(() => user.codeforcesStats);
    }
    if (user.leetcodeHandle) {
      user.leetcodeStats = await fetchLeetCode(user.leetcodeHandle).catch(() => user.leetcodeStats);
    }
    await user.save();
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to update handles" });
  }
});

router.get("/leaderboard", async (req, res) => {
  const users = await User.find({}, {
    name: 1, email: 1, srn: 1, role: 1,
    codeforcesHandle: 1, leetcodeHandle: 1,
    codeforcesStats: 1, leetcodeStats: 1
  }).sort({ "codeforcesStats.rating": -1, "leetcodeStats.totalSolved": -1 }).limit(200);
  res.json({ success: true, users });
});

export default router;
