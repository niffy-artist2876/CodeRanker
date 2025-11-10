/**
 * Frontend API client for leaderboard endpoints.
 *
 * Exposes:
 *  - apiGetLeaderboard({ limit?, offset?, signal? })
 *  - apiGetMyLeaderboardRank({ window?, signal? })
 *
 * All requests include credentials for cookie-based sessions.
 */

/**
 * Safely parse JSON from a Response without throwing on bad/missing JSON.
 * @param {Response} res
 * @returns {Promise<any|null>}
 */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Minimal fetch wrapper with credentials and JSON handling.
 * Throws on non-2xx responses with a helpful message when possible.
 *
 * @param {"GET"|"POST"|"PUT"|"PATCH"|"DELETE"} method
 * @param {string} url
 * @param {any} [body]
 * @param {AbortSignal} [signal]
 * @returns {Promise<any>}
 */
async function http(method, url, body, signal) {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Request failed (${res.status} ${res.statusText || ""})`.trim();
    const err = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

/**
 * Build a querystring from a params object, ignoring null/undefined.
 * @param {Record<string, any>} params
 */
function buildQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    search.append(k, String(v));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Fetch leaderboard ranking entries.
 *
 * @param {Object} [opts]
 * @param {number} [opts.limit=100]  Number of entries to return (1..500)
 * @param {number} [opts.offset=0]   Offset into the sorted leaderboard (0..5000)
 * @param {AbortSignal} [opts.signal]
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   updatedAt?: string,
 *   totalParticipants?: number,
 *   count?: number,
 *   limit?: number,
 *   offset?: number,
 *   computeMs?: number,
 *   weights?: { lcWeight: number, cfWeight: number, cfBaseline: number },
 *   leaderboard: Array<{
 *     rank: number,
 *     score: number,
 *     email: string|null,
 *     leetcodeUsername: string|null,
 *     codeforcesHandle: string|null,
 *     leetcode: {
 *       connected: boolean,
 *       exists: boolean|null,
 *       username: string|null,
 *       totalSolved: number|null,
 *       easy: number|null,
 *       medium: number|null,
 *       hard: number|null,
 *       error?: string
 *     },
 *     codeforces: {
 *       connected: boolean,
 *       exists: boolean|null,
 *       handle: string|null,
 *       rank: string|null,
 *       rating: number|null,
 *       maxRank: string|null,
 *       maxRating: number|null,
 *       error?: string
 *     },
 *     components?: {
 *       lcSolved: number,
 *       cfRating: number,
 *       cfAdjRating: number,
 *       lcWeight: number,
 *       cfWeight: number,
 *       cfBaseline: number
 *     }
 *   }>
 * }>}
 */
export async function apiGetLeaderboard(opts = {}) {
  const { limit = 100, offset = 0, signal } = opts || {};
  const qs = buildQuery({ limit, offset });
  return http("GET", `/api/leaderboard${qs}`, undefined, signal);
}

/**
 * Fetch the current user's leaderboard rank and a small surrounding window.
 *
 * @param {Object} [opts]
 * @param {number} [opts.window=3] Number of entries above/below to include (0..10)
 * @param {AbortSignal} [opts.signal]
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   found: boolean,
 *   index?: number,
 *   totalParticipants?: number,
 *   me?: any,
 *   window?: { start: number, end: number },
 *   surrounding?: any[]
 * }>}
 */
export async function apiGetMyLeaderboardRank(opts = {}) {
  const { window = 3, signal } = opts || {};
  const qs = buildQuery({ window });
  return http("GET", `/api/leaderboard/me${qs}`, undefined, signal);
}
