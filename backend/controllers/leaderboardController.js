import ExternalAccount from "../models/ExternalAccount.js";
import { getLeetCodeStats } from "../services/leetcodeService.js";
import { getCodeforcesStats } from "../services/codeforcesService.js";

const CF_BASELINE = Number(globalThis.process?.env?.CF_BASELINE ?? 800) || 800;
const LC_WEIGHT = Number(globalThis.process?.env?.LC_WEIGHT ?? 1) || 1;
const CF_WEIGHT = Number(globalThis.process?.env?.CF_WEIGHT ?? 1) || 1;
const CONCURRENCY =
  Number(globalThis.process?.env?.LEADERBOARD_CONCURRENCY ?? 8) || 8;


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


function parseIntParam(v, def, min, max) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (Number.isFinite(n)) {
    return Math.max(min, Math.min(max, n));
  }
  return def;
}

function computeCombinedScore({ lcSolved = 0, cfRating = 0 }) {
  const lc = Math.max(0, Number(lcSolved) || 0);
  const cfAdj = Math.max(0, (Number(cfRating) || 0) - CF_BASELINE);
  return LC_WEIGHT * lc + CF_WEIGHT * cfAdj;
}

function buildEntry({
  email,
  leetcodeUsername,
  codeforcesHandle,
  lcStats,
  cfStats,
  lcError,
  cfError,
  displayName, 
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


    displayName: publicName,

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

export async function getLeaderboardHandler(req, res) {
  const started = Date.now();

  const candidates = await ExternalAccount.find({
    $or: [{ leetcodeConnected: true }, { codeforcesConnected: true }],
  })
    .lean()
    .exec();

  const limit = parseIntParam(req?.query?.limit, 100, 1, 500);
  const offset = parseIntParam(req?.query?.offset, 0, 0, 5000);


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

export async function getMyRankHandler(req, res) {
  const email = req?.user?.profile?.email
    ? String(req.user.profile.email).trim().toLowerCase()
    : null;

  if (!email) {
    return res
      .status(400)
      .json({ ok: false, message: "Email not available in profile" });
  }

  const candidates = await ExternalAccount.find({
    $or: [{ leetcodeConnected: true }, { codeforcesConnected: true }],
  })
    .lean()
    .exec();



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
