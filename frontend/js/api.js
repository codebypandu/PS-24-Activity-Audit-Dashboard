const API_BASE = "/api";
const NODE_API_BASE = "/node-api";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {})
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !path.startsWith("/auth/")) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      body?.message ||
      body?.detail ||
      body?.error ||
      (typeof body === "string" ? body : "") ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

async function nodeApiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const response = await fetch(`${NODE_API_BASE}${path}`, {
    ...options,
    headers
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      body?.message ||
      body?.detail ||
      body?.error ||
      (typeof body === "string" ? body : "") ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}
