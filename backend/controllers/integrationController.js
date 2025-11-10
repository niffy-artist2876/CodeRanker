import { getLeetCodeStats } from "../services/leetcodeService.js";
import { getCodeforcesStats } from "../services/codeforcesService.js";
import ExternalAccount from "../models/ExternalAccount.js";


async function resolveLinkedHandles(req) {
  const email = req?.user?.profile?.email
    ? String(req.user.profile.email).trim().toLowerCase()
    : null;

  if (!email) {
    return { leetcodeUsername: null, codeforcesHandle: null };
  }

  try {
    const ext = await ExternalAccount.findOne({ email }).lean().exec();
    return {
      leetcodeUsername: ext?.leetcodeUsername || null,
      codeforcesHandle: ext?.codeforcesHandle || null,
    };
  } catch {
    return { leetcodeUsername: null, codeforcesHandle: null };
  }
}


export async function getLeetCodeStatsHandler(req, res) {
  const { leetcodeUsername } = await resolveLinkedHandles(req);

  if (!leetcodeUsername) {
    return res.json({
      ok: true,
      leetcode: {
        connected: false,
        exists: null,
        username: null,
        totalSolved: null,
        easy: null,
        medium: null,
        hard: null,
      },
    });
  }

  try {
    const stats = await getLeetCodeStats(leetcodeUsername);
    if (!stats) {
      return res.json({
        ok: true,
        leetcode: {
          connected: true,
          exists: false,
          username: leetcodeUsername,
          totalSolved: null,
          easy: null,
          medium: null,
          hard: null,
          error: "LeetCode user not found",
        },
      });
    }

    return res.json({
      ok: true,
      leetcode: {
        connected: true,
        exists: true,
        username: leetcodeUsername,
        totalSolved: stats.totalSolved ?? 0,
        easy: stats.easy ?? 0,
        medium: stats.medium ?? 0,
        hard: stats.hard ?? 0,
      },
    });
  } catch {
    return res.status(502).json({
      ok: false,
      leetcode: {
        connected: true,
        exists: null,
        username: leetcodeUsername,
        totalSolved: null,
        easy: null,
        medium: null,
        hard: null,
        error: "Failed to fetch LeetCode stats",
      },
    });
  }
}


export async function getCodeforcesStatsHandler(req, res) {
  const { codeforcesHandle } = await resolveLinkedHandles(req);

  if (!codeforcesHandle) {
    return res.json({
      ok: true,
      codeforces: {
        connected: false,
        exists: null,
        handle: null,
        rank: null,
        rating: null,
        maxRank: null,
        maxRating: null,
      },
    });
  }

  try {
    const stats = await getCodeforcesStats(codeforcesHandle);
    if (!stats) {
      return res.json({
        ok: true,
        codeforces: {
          connected: true,
          exists: false,
          handle: codeforcesHandle,
          rank: null,
          rating: null,
          maxRank: null,
          maxRating: null,
          error: "Codeforces user not found",
        },
      });
    }

    return res.json({
      ok: true,
      codeforces: {
        connected: true,
        exists: true,
        handle: stats.handle || codeforcesHandle,
        rank: stats.rank ?? null,
        rating: stats.rating ?? null,
        maxRank: stats.maxRank ?? null,
        maxRating: stats.maxRating ?? null,
      },
    });
  } catch {
    return res.status(502).json({
      ok: false,
      codeforces: {
        connected: true,
        exists: null,
        handle: codeforcesHandle,
        rank: null,
        rating: null,
        maxRank: null,
        maxRating: null,
        error: "Failed to fetch Codeforces stats",
      },
    });
  }
}


export async function getIntegrationStatsHandler(req, res) {
  const { leetcodeUsername, codeforcesHandle } =
    await resolveLinkedHandles(req);

  const lcDefault = {
    connected: Boolean(leetcodeUsername),
    exists: leetcodeUsername ? null : null,
    username: leetcodeUsername || null,
    totalSolved: null,
    easy: null,
    medium: null,
    hard: null,
  };

  const cfDefault = {
    connected: Boolean(codeforcesHandle),
    exists: codeforcesHandle ? null : null,
    handle: codeforcesHandle || null,
    rank: null,
    rating: null,
    maxRank: null,
    maxRating: null,
  };

  if (!leetcodeUsername && !codeforcesHandle) {
    return res.json({
      ok: true,
      leetcode: { ...lcDefault, connected: false },
      codeforces: { ...cfDefault, connected: false },
    });
  }

  const promises = [
    (async () => {
      if (!leetcodeUsername) return { ...lcDefault, connected: false };
      try {
        const stats = await getLeetCodeStats(leetcodeUsername);
        if (!stats) {
          return {
            ...lcDefault,
            exists: false,
            error: "LeetCode user not found",
          };
        }
        return {
          connected: true,
          exists: true,
          username: leetcodeUsername,
          totalSolved: stats.totalSolved ?? 0,
          easy: stats.easy ?? 0,
          medium: stats.medium ?? 0,
          hard: stats.hard ?? 0,
        };
      } catch {
        return {
          ...lcDefault,
          error: "Failed to fetch LeetCode stats",
        };
      }
    })(),
    (async () => {
      if (!codeforcesHandle) return { ...cfDefault, connected: false };
      try {
        const stats = await getCodeforcesStats(codeforcesHandle);
        if (!stats) {
          return {
            ...cfDefault,
            exists: false,
            error: "Codeforces user not found",
          };
        }
        return {
          connected: true,
          exists: true,
          handle: stats.handle || codeforcesHandle,
          rank: stats.rank ?? null,
          rating: stats.rating ?? null,
          maxRank: stats.maxRank ?? null,
          maxRating: stats.maxRating ?? null,
        };
      } catch {
        return {
          ...cfDefault,
          error: "Failed to fetch Codeforces stats",
        };
      }
    })(),
  ];

  const [leetcode, codeforces] = await Promise.all(promises);

  return res.json({
    ok: true,
    leetcode,
    codeforces,
  });
}

export async function getLinkedAccountsHandler(req, res) {
  const email = req?.user?.profile?.email
    ? String(req.user.profile.email).trim().toLowerCase()
    : null;

  if (!email) {
    return res
      .status(400)
      .json({ ok: false, message: "Email not available in profile" });
  }

  try {
    const acct = await ExternalAccount.findOne({ email }).lean().exec();
    if (!acct) {
      return res.json({
        ok: true,
        linked: false,
        email,
        leetcodeUsername: null,
        codeforcesHandle: null,
        leetcodeConnected: false,
        codeforcesConnected: false,
      });
    }

    return res.json({
      ok: true,
      linked: Boolean(acct.leetcodeConnected || acct.codeforcesConnected),
      email: acct.email,
      leetcodeUsername: acct.leetcodeUsername || null,
      codeforcesHandle: acct.codeforcesHandle || null,
      leetcodeConnected: !!acct.leetcodeConnected,
      codeforcesConnected: !!acct.codeforcesConnected,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Failed to read account mapping",
    });
  }
}


export async function upsertLinkedAccountsHandler(req, res) {
  const email = req?.user?.profile?.email
    ? String(req.user.profile.email).trim().toLowerCase()
    : null;

  if (!email) {
    return res
      .status(400)
      .json({ ok: false, message: "Email not available in profile" });
  }

  const { leetcodeUsername, codeforcesHandle } = req.body || {};

  try {
    let doc =
      (await ExternalAccount.findOne({ email })) ||
      (await ExternalAccount.upsertByEmail({ email }));

    if (
      Object.prototype.hasOwnProperty.call(req.body || {}, "leetcodeUsername")
    ) {
      const v =
        typeof leetcodeUsername === "string" && leetcodeUsername.trim()
          ? leetcodeUsername.trim()
          : null;
      doc.leetcodeUsername = v;
    }
    if (
      Object.prototype.hasOwnProperty.call(req.body || {}, "codeforcesHandle")
    ) {
      const v =
        typeof codeforcesHandle === "string" && codeforcesHandle.trim()
          ? codeforcesHandle.trim()
          : null;
      doc.codeforcesHandle = v;
    }

    const profileName = req?.user?.profile?.name
      ? String(req.user.profile.name).trim()
      : "";
    if (profileName) {
      doc.displayName = profileName;
    }
    doc.refreshConnectedFlags();

    await doc.save();

    return res.json({
      ok: true,
      email: doc.email,
      leetcodeUsername: doc.leetcodeUsername || null,
      codeforcesHandle: doc.codeforcesHandle || null,
      leetcodeConnected: !!doc.leetcodeConnected,
      codeforcesConnected: !!doc.codeforcesConnected,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Failed to update account mapping",
    });
  }
}
