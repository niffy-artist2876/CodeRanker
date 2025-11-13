import { Router } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }
    const base = process.env.PESU_AUTH_URL;
    const resp = await axios.post(`${base}/authenticate`, {
      username, password, profile: true
    });
    const data = resp?.data;
    if (!data?.status) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const profile = data.profile || {};
    const email = profile.email || `${username}@pesu.edu`;
    const name = profile.name || "Student";
    const srn = profile.username || username;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name, srn, role: "user" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: {
      id: user._id, name: user.name, email: user.email, srn: user.srn, role: user.role,
      codeforcesHandle: user.codeforcesHandle, leetcodeHandle: user.leetcodeHandle,
      codeforcesStats: user.codeforcesStats, leetcodeStats: user.leetcodeStats
    }});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

export default router;
