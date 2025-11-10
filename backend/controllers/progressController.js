import ExternalAccount from "../models/ExternalAccount.js";
import { getLeetCodeStats } from "../services/leetcodeService.js";
import { getCodeforcesStats } from "../services/codeforcesService.js";

/**
 * Resolve linked external handles strictly via PESU profile email using ExternalAccount mapping.
 *
 * @param {import("express").Request} req
 * @returns {Promise<{ email: string|null, leetcodeUsername: string|null, codeforcesHandle: string|null }>}
 */
async function resolveLinkedHandles(req) {
  const email = req?.user?.profile?.email
    ? String(req.user.profile.email).trim().toLowerCase()
    : null;

  if (!email) {
    return { email: null, leetcodeUsername: null, codeforcesHandle: null };
  }

  try {
    const ext = await ExternalAccount.findOne({ email }).lean().exec();
    return {
      email,
      leetcodeUsername: ext?.leetcodeUsername || null,
      codeforcesHandle: ext?.codeforcesHandle || null,
    };
  } catch {
    // Fail soft if DB is unavailable
    return { email, leetcodeUsername: null, codeforcesHandle: null };
  }
}

/**
 * Produce a normalized LeetCode progress response from stats or defaults.
 * @param {string|null} username
 * @param {any} stats
 */
function buildLeetCodeResponse(username, stats, error = undefined) {
  if (!username) {
    return {
      connected: false,
      exists: null,
      username: null,
      totalSolved: null,
      easy: null,
      medium: null,
      hard: null,
    };
  }

  if (!stats) {
    return {
      connected: true,
      exists: false,
      username,
      totalSolved: null,
      easy: null,
      medium: null,
      hard: null,
      ...(error ? { error } : {}),
    };
  }

  return {
    connected: true,
    exists: true,
    username: stats.username || username,
    totalSolved: stats.totalSolved ?? 0,
    easy: stats.easy ?? 0,
    medium: stats.medium ?? 0,
    hard: stats.hard ?? 0,
    ...(error ? { error } : {}),
  };
}

/**
 * Produce a normalized Codeforces progress response from stats or defaults.
 * @param {string|null} handle
 * @param {any} stats
 */
function buildCodeforcesResponse(handle, stats, error = undefined) {
  if (!handle) {
    return {
      connected: false,
      exists: null,
      handle: null,
      rank: null,
      rating: null,
      maxRank: null,
      maxRating: null,
    };
  }

  if (!stats) {
    return {
      connected: true,
      exists: false,
      handle,
      rank: null,
      rating: null,
      maxRank: null,
      maxRating: null,
      ...(error ? { error } : {}),
    };
  }

  return {
    connected: true,
    exists: true,
    handle: stats.handle || handle,
    rank: stats.rank ?? null,
    rating: stats.rating ?? null,
    maxRank: stats.maxRank ?? null,
    maxRating: stats.maxRating ?? null,
    ...(error ? { error } : {}),
  };
}

/**
 * GET /api/progress/overview
 *
 * Return a combined progress overview for the logged-in user across LeetCode and Codeforces.
 * This is a lightweight wrapper around the integration stats, shaped specifically for a "progress" page.
 *
 * Response example:
 * {
 *   ok: true,
 *   leetcode: { connected, exists, username, totalSolved, easy, medium, hard, error? },
 *   codeforces: { connected, exists, handle, rank, rating, maxRank, maxRating, error? },
 *   summary: {
 *     anyConnected: boolean,
 *     totalSolved: number|null,
 *     currentRating: number|null
 *   }
 * }
 *
 * Note: Requires upstream auth middleware to populate req.user.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function getProgressOverviewHandler(req, res) {
  const { leetcodeUsername, codeforcesHandle } =
    await resolveLinkedHandles(req);

  // If neither is connected, return early
  if (!leetcodeUsername && !codeforcesHandle) {
    return res.json({
      ok: true,
      leetcode: buildLeetCodeResponse(null, null),
      codeforces: buildCodeforcesResponse(null, null),
      summary: {
        anyConnected: false,
        totalSolved: null,
        currentRating: null,
      },
    });
  }

  // Fetch both concurrently when available
  const [lcResult, cfResult] = await Promise.all([
    (async () => {
      if (!leetcodeUsername) return buildLeetCodeResponse(null, null);
      try {
        const stats = await getLeetCodeStats(leetcodeUsername);
        if (!stats) {
          return buildLeetCodeResponse(
            leetcodeUsername,
            null,
            "LeetCode user not found",
          );
        }
        return buildLeetCodeResponse(leetcodeUsername, stats);
      } catch {
        return buildLeetCodeResponse(
          leetcodeUsername,
          null,
          "Failed to fetch LeetCode stats",
        );
      }
    })(),
    (async () => {
      if (!codeforcesHandle) return buildCodeforcesResponse(null, null);
      try {
        const stats = await getCodeforcesStats(codeforcesHandle);
        if (!stats) {
          return buildCodeforcesResponse(
            codeforcesHandle,
            null,
            "Codeforces user not found",
          );
        }
        return buildCodeforcesResponse(codeforcesHandle, stats);
      } catch {
        return buildCodeforcesResponse(
          codeforcesHandle,
          null,
          "Failed to fetch Codeforces stats",
        );
      }
    })(),
  ]);

  // Build a light summary for quick display
  const summary = {
    anyConnected: Boolean(lcResult.connected || cfResult.connected),
    totalSolved:
      lcResult.exists === true ? Number(lcResult.totalSolved || 0) : null,
    currentRating:
      cfResult.exists === true && typeof cfResult.rating === "number"
        ? cfResult.rating
        : null,
  };

  return res.json({
    ok: true,
    leetcode: lcResult,
    codeforces: cfResult,
    summary,
  });
}

/**
 * GET /api/progress/:platform
 * Platform is one of: "leetcode" | "codeforces"
 *
 * Returns platform-specific progress only.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function getPlatformProgressHandler(req, res) {
  const platform = String(req.params.platform || "").toLowerCase();
  const { leetcodeUsername, codeforcesHandle } =
    await resolveLinkedHandles(req);

  if (platform !== "leetcode" && platform !== "codeforces") {
    return res.status(400).json({
      ok: false,
      message: "Invalid platform. Expected 'leetcode' or 'codeforces'.",
    });
  }

  if (platform === "leetcode") {
    if (!leetcodeUsername) {
      return res.json({
        ok: true,
        leetcode: buildLeetCodeResponse(null, null),
      });
    }
    try {
      const stats = await getLeetCodeStats(leetcodeUsername);
      if (!stats) {
        return res.json({
          ok: true,
          leetcode: buildLeetCodeResponse(
            leetcodeUsername,
            null,
            "LeetCode user not found",
          ),
        });
      }
      return res.json({
        ok: true,
        leetcode: buildLeetCodeResponse(leetcodeUsername, stats),
      });
    } catch {
      return res.status(502).json({
        ok: false,
        leetcode: buildLeetCodeResponse(
          leetcodeUsername,
          null,
          "Failed to fetch LeetCode stats",
        ),
      });
    }
  }

  // platform === "codeforces"
  if (!codeforcesHandle) {
    return res.json({
      ok: true,
      codeforces: buildCodeforcesResponse(null, null),
    });
  }
  try {
    const stats = await getCodeforcesStats(codeforcesHandle);
    if (!stats) {
      return res.json({
        ok: true,
        codeforces: buildCodeforcesResponse(
          codeforcesHandle,
          null,
          "Codeforces user not found",
        ),
      });
    }
    return res.json({
      ok: true,
      codeforces: buildCodeforcesResponse(codeforcesHandle, stats),
    });
  } catch {
    return res.status(502).json({
      ok: false,
      codeforces: buildCodeforcesResponse(
        codeforcesHandle,
        null,
        "Failed to fetch Codeforces stats",
      ),
    });
  }
}
