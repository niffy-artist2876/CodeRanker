import ExternalAccount from "../models/ExternalAccount.js";
import { getLeetCodeStats } from "../services/leetcodeService.js";
import { getCodeforcesStats } from "../services/codeforcesService.js";

/**
 * Leaderboard controller
 *
 * Computes a combined score per participant using:
 * - LeetCode: total solved
 * - Codeforces: rating adjusted by a baseline (default 800)
 *
 * Combined score formula:
 *   score = LC_WEIGHT * (leetcode.totalSolved) + CF_WEIGHT * max(codeforces.rating - CF_BASELINE, 0)
 *
 * Env configuration (optional):
 *   - CF_BASELINE: number (default: 800)
 *   - LC_WEIGHT: number (default: 1)
 *   - CF_WEIGHT: number (default: 1)
 *   - LEADERBOARD_CONCURRENCY: number (default: 8)
 */

const CF_BASELINE = Number(globalThis.process?.env?.CF_BASELINE ?? 800) || 800;
const LC_WEIGHT = Number(globalThis.process?.env?.LC_WEIGHT ?? 1) || 1;
const CF_WEIGHT = Number(globalThis.process?.env?.CF_WEIGHT ?? 1) || 1;
const CONCURRENCY =
  Number(globalThis.process?.env?.LEADERBOARD_CONCURRENCY ?? 8) || 8;

/**
 * Simple concurrency-limited mapper (p-map style).
 * @template T,U
 * @param {T[]} input
 * @param {(item: T, index: number) => Promise<U>} mapper
 * @param {number} concurrency
 * @returns {Promise<U[]>}
 */
async function pMap(input, mapper, concurrency = 8) {
  const results = new Array(input.length);
  let nextIndex = 0;
  let active = 0;

  return new Promise((resolve, reject) => {
    const startNext = () => {
      while (active < concurrency && nextIndex < input.length) {
        const current = nextIndex++;
        active++;
        Promise.resolve(mapper(input[current], current))
          .then((r) => {
            results[current] = r;
            active--;
            if (
              results.length === input.length &&
              nextIndex >= input.length &&
              active === 0
            ) {
              resolve(results);
            } else {
              startNext();
            }
          })
          .catch((err) => {
            // Fail-fast: reject on first error
            reject(err);
          });
      }
      if (nextIndex >= input.length && active === 0) {
        resolve(results);
      }
    };
    startNext();
  });
}

/**
 * Parse a positive integer from query with clamping.
 */
function parseIntParam(v, def, min, max) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (Number.isFinite(n)) {
    return Math.max(min, Math.min(max, n));
  }
  return def;
}

/**
 * Compute combined score based on LC solved and CF rating.
 */
function computeCombinedScore({ lcSolved = 0, cfRating = 0 }) {
  const lc = Math.max(0, Number(lcSolved) || 0);
  const cfAdj = Math.max(0, (Number(cfRating) || 0) - CF_BASELINE);
  return LC_WEIGHT * lc + CF_WEIGHT * cfAdj;
}

/**
 * Build a single participant leaderboard entry.
 */
function buildEntry({
  email,
  leetcodeUsername,
  codeforcesHandle,
  lcStats,
  cfStats,
  lcError,
  cfError,
  displayName, // PESUAuth display name if available
}) {
  const lcSolved = Math.max(0, Number(lcStats?.totalSolved || 0));
  const cfRating = typeof cfStats?.rating === "number" ? cfStats.rating : 0;

  const score = computeCombinedScore({ lcSolved, cfRating });

  const publicName =
    displayName && String(displayName).trim()
      ? String(displayName).trim()
      : null;

  return {
    email: email || null,

    // Explicit display name (preferred by frontend if available)

    displayName: publicName,

    // Preserve original handles; frontend will prefer displayName for rendering
    leetcodeUsername: leetcodeUsername || null,
    codeforcesHandle: codeforcesHandle || null,

    leetcode: {
      connected: Boolean(leetcodeUsername),
      exists: lcStats ? true : leetcodeUsername ? false : null,
      username: lcStats?.username || leetcodeUsername || null,
      totalSolved: lcStats?.totalSolved ?? (leetcodeUsername ? 0 : null),
      easy: lcStats?.easy ?? (leetcodeUsername ? 0 : null),
      medium: lcStats?.medium ?? (leetcodeUsername ? 0 : null),
      hard: lcStats?.hard ?? (leetcodeUsername ? 0 : null),
      ...(lcError ? { error: lcError } : {}),
    },
    codeforces: {
      connected: Boolean(codeforcesHandle),
      exists: cfStats ? true : codeforcesHandle ? false : null,
      handle: cfStats?.handle || codeforcesHandle || null,
      rank: cfStats?.rank ?? (codeforcesHandle ? null : null),
      rating:
        typeof cfStats?.rating === "number"
          ? cfStats.rating
          : codeforcesHandle
            ? 0
            : null,
      maxRank: cfStats?.maxRank ?? (codeforcesHandle ? null : null),
      maxRating:
        typeof cfStats?.maxRating === "number"
          ? cfStats.maxRating
          : codeforcesHandle
            ? null
            : null,
      ...(cfError ? { error: cfError } : {}),
    },

    components: {
      lcSolved,
      cfRating,
      cfAdjRating: Math.max(0, cfRating - CF_BASELINE),
      lcWeight: LC_WEIGHT,
      cfWeight: CF_WEIGHT,
      cfBaseline: CF_BASELINE,
    },

    score,
  };
}

/**
 * Assign dense ranks to sorted entries (descending by score, then tiebreakers).
 * Dense ranking: 1,2,2,3,4...
 */
function assignDenseRanks(sortedEntries) {
  let lastScore = null;
  let lastRank = 0;
  for (let i = 0; i < sortedEntries.length; i++) {
    const e = sortedEntries[i];
    if (lastScore === null || e.score !== lastScore) {
      lastRank += 1;
      lastScore = e.score;
    }
    e.rank = lastRank;
  }
  return sortedEntries;
}

/**
 * GET /api/leaderboard
 *
 * Query params:
 * - limit?: number (1..500, default 100)
 * - offset?: number (0..5000, default 0) — applied after sorting
 *
 * Response:
 * {
 *   ok: true,
 *   updatedAt: string,
 *   totalParticipants: number,     // connected accounts considered (by ExternalAccount)
 *   count: number,                 // number of entries returned
 *   limit: number,
 *   offset: number,
 *   leaderboard: Array<{
 *     rank: number,
 *     score: number,
 *     components: { lcSolved, cfRating, cfAdjRating, lcWeight, cfWeight, cfBaseline },
 *     email: string|null,
 *     leetcodeUsername: string|null,
 *     codeforcesHandle: string|null,
 *     leetcode: { connected, exists, username, totalSolved, easy, medium, hard, error? },
 *     codeforces: { connected, exists, handle, rank, rating, maxRank, maxRating, error? }
 *   }>
 * }
 */
export async function getLeaderboardHandler(req, res) {
  const started = Date.now();

  // Pull candidates from the mapping collection (any connected)
  const candidates = await ExternalAccount.find({
    $or: [{ leetcodeConnected: true }, { codeforcesConnected: true }],
  })
    .lean()
    .exec();

  const limit = parseIntParam(req?.query?.limit, 100, 1, 500);
  const offset = parseIntParam(req?.query?.offset, 0, 0, 5000);

  // Build a name map from PESUAuth tokens for all candidate emails

  // For each candidate, fetch stats concurrently with bounded concurrency
  const rows = await pMap(
    candidates,
    async (acct) => {
      const email = acct?.email || null;
      const leetcodeUsername = acct?.leetcodeUsername || null;
      const codeforcesHandle = acct?.codeforcesHandle || null;
      const displayName = acct?.displayName || null;
      let lcStats = null;
      let cfStats = null;
      let lcError = undefined;
      let cfError = undefined;

      // Fetch both if present, independently
      await Promise.allSettled([
        (async () => {
          if (!leetcodeUsername) return;
          try {
            lcStats = await getLeetCodeStats(leetcodeUsername);
            if (!lcStats) {
              lcError = "LeetCode user not found";
            }
          } catch {
            lcStats = null;
            lcError = "Failed to fetch LeetCode stats";
          }
        })(),
        (async () => {
          if (!codeforcesHandle) return;
          try {
            cfStats = await getCodeforcesStats(codeforcesHandle);
            if (!cfStats) {
              cfError = "Codeforces user not found";
            }
          } catch {
            cfStats = null;
            cfError = "Failed to fetch Codeforces stats";
          }
        })(),
      ]);

      return buildEntry({
        email,
        leetcodeUsername,
        codeforcesHandle,
        lcStats,
        cfStats,
        lcError,
        cfError,
        displayName,
      });
    },
    CONCURRENCY,
  );

  // Sort by score desc; tiebreaker: higher CF rating, then higher LC solved, then handle/name
  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const br = (b.components?.cfRating ?? 0) - (a.components?.cfRating ?? 0);
    if (br !== 0) return br;
    const blc = (b.components?.lcSolved ?? 0) - (a.components?.lcSolved ?? 0);
    if (blc !== 0) return blc;

    const an = (
      a.codeforcesHandle ||
      a.leetcodeUsername ||
      a.email ||
      ""
    ).toLowerCase();
    const bn = (
      b.codeforcesHandle ||
      b.leetcodeUsername ||
      b.email ||
      ""
    ).toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  });

  // Assign ranks (dense) then apply pagination
  assignDenseRanks(rows);
  const sliced = rows.slice(offset, offset + limit);

  return res.json({
    ok: true,
    updatedAt: new Date().toISOString(),
    totalParticipants: candidates.length,
    count: sliced.length,
    limit,
    offset,
    computeMs: Date.now() - started,
    leaderboard: sliced,
    weights: {
      lcWeight: LC_WEIGHT,
      cfWeight: CF_WEIGHT,
      cfBaseline: CF_BASELINE,
    },
  });
}

/**
 * GET /api/leaderboard/me
 *
 * Convenience handler: returns the current user's leaderboard entry and rank,
 * if present, along with surrounding context (top N optional).
 *
 * Query params:
 * - window?: number (how many entries above/below to include, default 3, max 10)
 */
export async function getMyRankHandler(req, res) {
  const email = req?.user?.profile?.email
    ? String(req.user.profile.email).trim().toLowerCase()
    : null;

  if (!email) {
    return res
      .status(400)
      .json({ ok: false, message: "Email not available in profile" });
  }

  // Pull candidates with the same logic as getLeaderboardHandler
  const candidates = await ExternalAccount.find({
    $or: [{ leetcodeConnected: true }, { codeforcesConnected: true }],
  })
    .lean()
    .exec();

  // Build name map for candidates

  // Build full rows (we don't paginate here to locate exact rank)
  const rows = await pMap(
    candidates,
    async (acct) => {
      const leetcodeUsername = acct?.leetcodeUsername || null;
      const codeforcesHandle = acct?.codeforcesHandle || null;
      const displayName = acct?.displayName || null;

      let lcStats = null;
      let cfStats = null;
      let lcError = undefined;
      let cfError = undefined;

      await Promise.allSettled([
        (async () => {
          if (!leetcodeUsername) return;
          try {
            lcStats = await getLeetCodeStats(leetcodeUsername);
            if (!lcStats) lcError = "LeetCode user not found";
          } catch {
            lcStats = null;
            lcError = "Failed to fetch LeetCode stats";
          }
        })(),
        (async () => {
          if (!codeforcesHandle) return;
          try {
            cfStats = await getCodeforcesStats(codeforcesHandle);
            if (!cfStats) cfError = "Codeforces user not found";
          } catch {
            cfStats = null;
            cfError = "Failed to fetch Codeforces stats";
          }
        })(),
      ]);

      return buildEntry({
        email: acct?.email || null,
        leetcodeUsername,
        codeforcesHandle,
        lcStats,
        cfStats,
        lcError,
        cfError,
        displayName,
      });
    },
    CONCURRENCY,
  );

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const br = (b.components?.cfRating ?? 0) - (a.components?.cfRating ?? 0);
    if (br !== 0) return br;
    const blc = (b.components?.lcSolved ?? 0) - (a.components?.lcSolved ?? 0);
    if (blc !== 0) return blc;
    const an = (
      a.codeforcesHandle ||
      a.leetcodeUsername ||
      a.email ||
      ""
    ).toLowerCase();
    const bn = (
      b.codeforcesHandle ||
      b.leetcodeUsername ||
      b.email ||
      ""
    ).toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  });
  assignDenseRanks(rows);

  const idx = rows.findIndex((r) => r.email && r.email.toLowerCase() === email);
  if (idx < 0) {
    return res.json({
      ok: true,
      found: false,
      message:
        "You are not part of the leaderboard yet. Link your LeetCode/Codeforces in Progress page.",
    });
  }

  const window = parseIntParam(req?.query?.window, 3, 0, 10);
  const start = Math.max(0, idx - window);
  const end = Math.min(rows.length, idx + window + 1);
  const slice = rows.slice(start, end);

  return res.json({
    ok: true,
    found: true,
    index: idx,
    totalParticipants: rows.length,
    me: rows[idx],
    window: { start, end },
    surrounding: slice,
  });
}
