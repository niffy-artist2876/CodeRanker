import { setTimeout as sleep } from "timers/promises";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const REQUEST_TIMEOUT_MS = 12000;


async function leetcodeGraphQL(query, variables = {}) {
  const controller = new AbortController();
  const abortTimeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Origin: "https://leetcode.com",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    clearTimeout(abortTimeout);

    if (!res.ok) {
      const text = await safeText(res);
      throw new Error(
        `LeetCode GraphQL ${res.status}: ${text || res.statusText}`,
      );
    }

    const data = await res.json();
    if (data?.errors?.length) {
      const msg = data.errors.map((e) => e.message).join("; ");
      throw new Error(`LeetCode GraphQL error: ${msg}`);
    }
    return data?.data ?? null;
  } catch (err) {
    clearTimeout(abortTimeout);
    await sleep(50);
    throw err;
  }
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return null;
  }
}


function normalizeLeetCodeUsername(username) {
  const u = String(username || "").trim();
  if (!u) throw new Error("Username is required");
  if (!/^[A-Za-z0-9_-]+$/.test(u)) {
    throw new Error("Invalid LeetCode username format");
  }
  return u;
}


export async function getLeetCodeStats(username) {
  const u = normalizeLeetCodeUsername(username);

  const query = `
    query userStats($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats: submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const data = await leetcodeGraphQL(query, { username: u });

  const matched = data?.matchedUser || null;
  if (!matched) {
    return null;
  }

  const rows = matched?.submitStats?.acSubmissionNum || [];
  const byDiff = new Map(
    rows.map((r) => [
      String(r?.difficulty || "").toLowerCase(),
      Number(r?.count || 0),
    ]),
  );

  const totalSolved =
    byDiff.get("all") ??
    ["easy", "medium", "hard"].reduce(
      (acc, d) => acc + (byDiff.get(d) || 0),
      0,
    );

  return {
    username: matched.username || u,
    totalSolved: Number(totalSolved || 0),
    easy: Number(byDiff.get("easy") || 0),
    medium: Number(byDiff.get("medium") || 0),
    hard: Number(byDiff.get("hard") || 0),
  };
}

export async function verifyLeetCodeUsername(username) {
  const u = normalizeLeetCodeUsername(username);

  const query = `
    query checkUser($username: String!) {
      matchedUser(username: $username) { username }
    }
  `;

  const data = await leetcodeGraphQL(query, { username: u });
  return Boolean(data?.matchedUser?.username);
}
