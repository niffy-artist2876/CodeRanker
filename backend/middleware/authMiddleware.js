import jwt from "jsonwebtoken";
import Token from "../models/Token.js";

export async function requireAuth(req, res, next) {
  const secret = process.env.JWT_SECRET || "development-secret";
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const cookieToken = req.cookies?.session;
  const token = bearer || cookieToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    try {
      jwt.verify(token, secret, {
        algorithms: ["HS256"],
      });
    } catch {
      return res
        .status(401)
        .json({ message: "Invalid session: Token verification failed" });
    }

    const tokenDoc = await Token.findValidToken(token);

    if (!tokenDoc) {
      return res.status(401).json({
        message:
          "Invalid session: Token not found or revoked. Please login again.",
      });
    }
    req.user = {
      profile: tokenDoc.profile,
      role: tokenDoc.role,
      srn: tokenDoc.srn,
      userId: tokenDoc.userId,
    };
    req.tokenDoc = tokenDoc;

    return next();
  } catch (error) {
    console.error("Token validation error:", error);

    try {
      const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });

      console.warn("Token DB unavailable, proceeding with JWT-only validation");

      req.user = payload;

      return next();
    } catch {
      return res
        .status(401)
        .json({ message: "Invalid session: Token verification failed" });
    }
  }
}
