const raw = import.meta.env.VITE_API_URL;
// Falls back to the deployed API so a hosted build with no VITE_API_URL
// still reaches the backend instead of a localhost that isn't there.
export const API_URL: string = raw?.replace(/\/+$/, "") || "https://nursery-backend-c8yw.onrender.com";
