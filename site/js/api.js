const API_BASE = "https://agent-name-api.matthew-l-reed.workers.dev";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }

  get isRateLimit() {
    return this.status === 429;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new ApiError("Network error — check your connection and try again.", 0);
  }

  if (!res.ok) {
    if (res.status === 429) {
      throw new ApiError("Rate limited — wait a moment and try again.", 429);
    }
    const text = await res.text().catch(() => "");
    throw new ApiError(text || `Request failed (${res.status})`, res.status);
  }

  return res.json();
}

export async function generateNames(count = 5) {
  const data = await request(`/generate?count=${count}`);
  return data.names;
}

export async function suggestNames(purpose) {
  const data = await request("/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose }),
  });
  return data;
}
