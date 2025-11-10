import crypto from "crypto";

export function sha256Hash(input) {
  if (!input) throw new Error("Input is required for hashing");
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hmacSha256(data, secret) {
  if (!data || !secret) throw new Error("Data and secret are required");
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

export function verifySha256(input, hash) {
  const inputHash = sha256Hash(input);
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
}

export function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString("hex");
}

export function hashPasswordWithSalt(password, salt) {
  const hash = sha256Hash(password + salt);
  return `${salt}:${hash}`;
}

export function verifyPasswordWithSalt(password, saltedHash) {
  const [salt, hash] = saltedHash.split(":");
  if (!salt || !hash) return false;
  const computedHash = sha256Hash(password + salt);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}
