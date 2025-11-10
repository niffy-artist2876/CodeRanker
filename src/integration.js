
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function http(method, url, body) {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      "Accept": "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}


export async function apiGetLinkedAccounts() {
  return http("GET", "/api/integration/linked");
}

export async function apiUpsertLinkedAccounts(payload = {}) {
  return http("PUT", "/api/integration/linked", payload);
}


export async function apiVerifyLeetCodeUsername(username) {
  const u = encodeURIComponent(String(username || "").trim());
  return http("GET", `/api/integration/verify/leetcode/${u}`);
}

export async function apiVerifyCodeforcesHandle(handle) {
  const h = encodeURIComponent(String(handle || "").trim());
  return http("GET", `/api/integration/verify/codeforces/${h}`);
}


export async function apiGetLeetCodeStats() {
  return http("GET", "/api/integration/stats/leetcode");
}

export async function apiGetCodeforcesStats() {
  return http("GET", "/api/integration/stats/codeforces");
}

export async function apiGetIntegrationStats() {
  return http("GET", "/api/integration/stats");
}

function adaptIntegrationToProgress(data) {
  const leetcode = data?.leetcode ?? {
    connected: false,
    exists: null,
    username: null,
    totalSolved: null,
    easy: null,
    medium: null,
    hard: null,
  };
  const codeforces = data?.codeforces ?? {
    connected: false,
    exists: null,
    handle: null,
    rank: null,
    rating: null,
    maxRank: null,
    maxRating: null,
  };

  const summary = {
    anyConnected: Boolean(leetcode.connected || codeforces.connected),
    totalSolved:
      leetcode.exists === true ? Number(leetcode.totalSolved || 0) : null,
    currentRating:
      codeforces.exists === true && typeof codeforces.rating === "number"
        ? codeforces.rating
        : null,
  };

  return { ok: true, leetcode, codeforces, summary };
}

export async function apiGetProgressOverview() {
  try {
    return await http("GET", "/api/progress/overview");
  } catch (err) {
    if (err?.status === 404) {
      const data = await apiGetIntegrationStats();
      return adaptIntegrationToProgress(data);
    }
    throw err;
  }
}

export async function apiGetPlatformProgress(platform) {
  const p = String(platform || "").toLowerCase();
  if (p !== "leetcode" && p !== "codeforces") {
    throw new Error("Invalid platform. Expected 'leetcode' or 'codeforces'.");
  }

  try {
    return await http("GET", `/api/progress/${p}`);
  } catch (err) {
    if (err?.status === 404) {
      if (p === "leetcode") {
        const data = await apiGetLeetCodeStats();
        return { ok: true, leetcode: data?.leetcode ?? data };
      } else {
        const data = await apiGetCodeforcesStats();
        return { ok: true, codeforces: data?.codeforces ?? data };
      }
    }
    throw err;
  }
}
