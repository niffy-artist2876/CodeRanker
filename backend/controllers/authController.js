import jwt from "jsonwebtoken";
import { authenticate } from "../services/pesuAuthService.js";
import Token from "../models/Token.js";

function signSession(payload) {
  const secret = process.env.JWT_SECRET || "development-secret";

  return jwt.sign(payload, secret, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
}

function getTokenExpiration(token) {
  const decoded = jwt.decode(token);
  return decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export async function loginHandler(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ message: "Missing credentials" });

  try {
    const data = await authenticate(username, password, true);

    if (!data?.status) {
      return res
        .status(401)
        .json({ message: data?.message || "Invalid credentials" });
    }

    const profile = data.profile || {};
    const srn = profile.srn || username;
    const role = "student";

    const token = signSession({ profile, role, srn });
    const expiresAt = getTokenExpiration(token);

    try {
      const tokenDoc = await Token.create({
        token,
        userId: srn,
        srn,
        role,
        profile,
        expiresAt,
      });

      res.cookie("session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        ok: true,
        profile,
        role,
        tokenId: tokenDoc._id,
      });
    } catch (dbError) {
      console.error("Failed to store token in database:", dbError);

      res.cookie("session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ ok: true, profile, role });
    }
  } catch (err) {
    const message = err.message || "Auth service unavailable";
    const statusCode =
      message.includes("timeout") || message.includes("unavailable")
        ? 503
        : 500;
    return res.status(statusCode).json({ message });
  }
}

export async function meHandler(req, res) {
  return res.json({ ok: true, user: req.user });
}

export async function logoutHandler(req, res) {
  const token =
    req.cookies?.session ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  res.clearCookie("session", {
    httpOnly: true,
    sameSite: "lax",
    secure: globalThis.process?.env?.NODE_ENV === "production",
  });

  if (token) {
    try {
      const tokenDoc = await Token.findOne({ token, revoked: false });
      if (tokenDoc) {
        await tokenDoc.revoke();
      }
    } catch (error) {
      console.error("Failed to revoke token:", error);
    }
  }

  return res.json({ ok: true });
}
