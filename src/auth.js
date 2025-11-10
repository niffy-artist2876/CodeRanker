export async function apiLogin(username, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || "Login failed");
  }
  return res.json();
}

export async function apiMe() {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export async function apiLogout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
