
const CF_API_BASE = "https://codeforces.com/api";
const REQUEST_TIMEOUT_MS = 12000;


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
    if (!data || (data.status && data.status !== "OK")) {
      const comment = data?.comment || "Unknown error";
      throw new Error(`Codeforces API error: ${comment}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
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
    if (String(err.message || "").toLowerCase().includes("not found")) {
      return null;
    }
    throw err;
  }
}


export async function verifyCodeforcesHandle(handle) {
  const stats = await getCodeforcesStats(handle);
  return Boolean(stats);
}
