/*
 * LeetCode service
 *
 * Provides helpers to:
 * - Verify a LeetCode username exists
 * - Fetch solved counts by difficulty (for progress display)
 */

import { setTimeout as sleep } from "timers/promises";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const REQUEST_TIMEOUT_MS = 12000;

/**
 * Perform a POST request to LeetCode GraphQL with timeout.
 * Throws on network errors or non-2xx responses.
 *
 * @param {string} query
 * @param {Record<string, any>} variables
 * @returns {Promise<any>}
 */
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
    // small breather in case of transient upstream throttling
    await sleep(50);
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
 * Normalize and validate a potential LeetCode username.
 * LeetCode usernames typically allow letters, digits, underscores and hyphens.
 *
 * @param {unknown} username
 * @returns {string} normalized username
 * @throws {Error} when invalid
 */
function normalizeLeetCodeUsername(username) {
  const u = String(username || "").trim();
  if (!u) throw new Error("Username is required");
  // hyphen is placed at the end of the character class to avoid creating a range
  if (!/^[A-Za-z0-9_-]+$/.test(u)) {
    throw new Error("Invalid LeetCode username format");
  }
  return u;
}

/**
 * Fetch solved counts by difficulty for a LeetCode user.
 *
 * Returns null when the user does not exist.
 * Throws on network/service errors.
 *
 * @param {string} username
 * @returns {Promise<{
 *   username: string,
 *   totalSolved: number,
 *   easy: number,
 *   medium: number,
 *   hard: number
 * } | null>}
 */
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
    // User not found on LeetCode
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
    // Fallback: sum difficulties if "All" missing (rare)
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

/**
 * Lightweight existence check for a LeetCode username.
 * Returns true if the user exists, false if not found.
 * Throws on network/service errors.
 *
 * @param {string} username
 * @returns {Promise<boolean>}
 */
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
