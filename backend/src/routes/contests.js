import { Router } from "express";
import Contest from "../models/Contest.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import requireFutureDate from "../middleware/dateCheck.js";

const router = Router();

router.get("/", async (_req, res) => {
  const contests = await Contest.find().sort({ date: -1 });
  res.json({ success: true, contests });
});

router.post("/", requireAuth, requireAdmin, requireFutureDate("date"), async (req, res) => {
  try {
    const { title, date } = req.body;
    const contest = await Contest.create({ title, date, createdBy: req.userId });
    res.status(201).json({ success: true, contest });
  } catch (e) {
    res.status(400).json({ success: false, message: "Failed to create contest" });
  }
});

router.get("/:id", async (req, res) => {
  const c = await Contest.findById(req.params.id).populate("participants", "name srn");
  if (!c) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, contest: c });
});

export default router;
