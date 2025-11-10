
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}


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


function buildQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    search.append(k, String(v));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function apiGetLeaderboard(opts = {}) {
  const { limit = 100, offset = 0, signal } = opts || {};
  const qs = buildQuery({ limit, offset });
  return http("GET", `/api/leaderboard${qs}`, undefined, signal);
}

export async function apiGetMyLeaderboardRank(opts = {}) {
  const { window = 3, signal } = opts || {};
  const qs = buildQuery({ window });
  return http("GET", `/api/leaderboard/me${qs}`, undefined, signal);
}
