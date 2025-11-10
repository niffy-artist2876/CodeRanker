/*
 * Codeforces service
 *
 * Exposes helpers to:
 * - Verify a Codeforces handle exists
 * - Fetch rank/rating stats for progress display
 */

const CF_API_BASE = "https://codeforces.com/api";
const REQUEST_TIMEOUT_MS = 12000;

/**
 * Perform a GET request to Codeforces public API with timeout.
 * Throws on network errors, timeouts, or non-OK API status.
 *
 * @param {string} url
 * @returns {Promise<any>}
 */
async function cfGet(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await safeText(res);
      throw new Error(`Codeforces API ${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json();
    // Codeforces wraps responses as: { status: "OK"|"FAILED", comment?: string, result?: any }
    if (!data || (data.status && data.status !== "OK")) {
      const comment = data?.comment || "Unknown error";
      // For user not found, CF typically returns status: "FAILED" and a message mentioning the handle
      // Callers can treat this as "not found" by checking result/length
      // Here we throw so callers can decide to transform it to null for "not found" semantics if desired.
      throw new Error(`Codeforces API error: ${comment}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    // Re-throw for caller handling
    throw err;
  }
}

/**
 * Safely read response text without throwing further.
 * @param {Response} res
 * @returns {Promise<string|null>}
 */
async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Normalize and validate a potential Codeforces handle.
 * Allowed characters: letters, digits, underscore. Length: 3..24 (CF typical).
 *
 * @param {unknown} handle
 * @returns {string} normalized handle
 * @throws {Error} when invalid
 */
function normalizeCodeforcesHandle(handle) {
  const h = String(handle || "").trim();
  if (!h) throw new Error("Handle is required");
  if (h.length < 3 || h.length > 24) {
    throw new Error("Invalid Codeforces handle length");
  }
  if (!/^[A-Za-z0-9_]+$/.test(h)) {
    throw new Error("Invalid Codeforces handle format");
  }
  return h;
}

/**
 * Fetch Codeforces user stats (rank/rating).
 *
 * Returns null when the user does not exist.
 * Throws on network/service errors.
 *
 * @param {string} handle
 * @returns {Promise<{
 *  handle: string,
 *  rank: string|null,
 *  rating: number|null,
 *  maxRank: string|null,
 *  maxRating: number|null
 * } | null>}
 */
export async function getCodeforcesStats(handle) {
  const h = normalizeCodeforcesHandle(handle);
  const url = `${CF_API_BASE}/user.info?handles=${encodeURIComponent(h)}`;

  try {
    const data = await cfGet(url);
    const results = Array.isArray(data?.result) ? data.result : [];
    if (!results.length) {
      return null;
    }
    const u = results[0] || {};
    return {
      handle: u.handle ?? h,
      rank: u.rank ?? null,
      rating: typeof u.rating === "number" ? u.rating : null,
      maxRank: u.maxRank ?? null,
      maxRating: typeof u.maxRating === "number" ? u.maxRating : null,
    };
  } catch (err) {
    // If the API indicates "FAILED" with user not found, treat as null
    if (String(err.message || "").toLowerCase().includes("not found")) {
      return null;
    }
    // Re-throw other errors (network, rate-limit, etc.)
    throw err;
  }
}

/**
 * Lightweight existence check for a Codeforces handle.
 * Returns true if the user exists, false if not found.
 * Throws on network/service errors.
 *
 * @param {string} handle
 * @returns {Promise<boolean>}
 */
export async function verifyCodeforcesHandle(handle) {
  const stats = await getCodeforcesStats(handle);
  return Boolean(stats);
}
