const rawBase = (import.meta.env.VITE_API_BASE_URL || "").trim();

// If VITE_API_BASE_URL is not provided, requests use same-origin relative paths.
export const API_BASE_URL = rawBase.replace(/\/+$/, "");
