import Token from "../models/Token.js";
export async function revokeAllUserTokens(userId) {
  const result = await Token.revokeAllUserTokens(userId);
  return { revoked: result.modifiedCount };
}

export async function getUserTokens(userId) {
  return Token.find({
    userId,
    revoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
}

export async function revokeToken(token) {
  const tokenDoc = await Token.findOne({ token, revoked: false });
  if (tokenDoc) {
    await tokenDoc.revoke();
    return true;
  }
  return false;
}

export async function getTokenStats() {
  const total = await Token.countDocuments();
  const active = await Token.countDocuments({
    revoked: false,
    expiresAt: { $gt: new Date() }
  });
  const revoked = await Token.countDocuments({ revoked: true });
  const expired = await Token.countDocuments({
    expiresAt: { $lt: new Date() }
  });

  return {
    total,
    active,
    revoked,
    expired
  };
}


export async function cleanupExpiredTokens() {
  const result = await Token.cleanupExpired();
  return { deleted: result.deletedCount };
}


export async function getInactiveTokens(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return Token.find({
    revoked: false,
    expiresAt: { $gt: new Date() },
    lastUsed: { $lt: cutoffDate }
  });
}


export async function revokeInactiveTokens(days = 90) {
  const inactiveTokens = await getInactiveTokens(days);
  const revokedCount = await Promise.all(
    inactiveTokens.map(token => token.revoke())
  );
  return { revoked: revokedCount.length };
}

