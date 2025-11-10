const pesuAuthBaseUrl =
  process.env.PESU_AUTH_BASE_URL || "http://localhost:5000";
const REQUEST_TIMEOUT = 10000;

export async function authenticate(username, password, includeProfile = true) {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${pesuAuthBaseUrl}/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        profile: includeProfile,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `PESU Auth API returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("Request timeout: PESU Auth service did not respond");
    }

    if (error.message.includes("fetch")) {
      throw new Error("PESU Auth service is unavailable");
    }

    throw error;
  }
}

export async function checkHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${pesuAuthBaseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("Health check timeout");
    }

    throw new Error("PESU Auth service is unavailable");
  }
}
