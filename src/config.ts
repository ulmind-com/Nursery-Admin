const raw = import.meta.env.VITE_API_URL;
export const API_URL: string = raw?.replace(/\/+$/, "") || "http://localhost:8000";
