const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, "");

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildUrl(path, params = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function request(path, options = {}) {
  const { method = "GET", body, params, signal } = options;
  const response = await fetch(buildUrl(path, params), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.detail || "Something went wrong.";
    throw new ApiError(message, response.status);
  }

  return payload;
}

export function fetchTasks(filters = {}, signal) {
  return request("/tasks", { params: filters, signal });
}

export function fetchSummary(options = {}) {
  return request("/tasks/summary", options);
}

export function createTask(data) {
  return request("/tasks", {
    method: "POST",
    body: data,
  });
}

export function updateTask(id, data) {
  return request(`/tasks/${id}`, {
    method: "PUT",
    body: data,
  });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, {
    method: "DELETE",
  });
}

export { ApiError };
