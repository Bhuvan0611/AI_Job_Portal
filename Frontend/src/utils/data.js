// In dev this defaults to the local backend exactly as before. For a
// production build (where Express serves the built frontend from the same
// origin as the API — see Backend/index.js), set VITE_API_BASE_URL="" in a
// .env.production file so these become same-origin relative paths instead
// of a hardcoded localhost URL that would never resolve for real users.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5011";

export const USER_API_ENDPOINT = `${API_BASE}/api/user`;
export const JOB_API_ENDPOINT = `${API_BASE}/api/job`;
export const APPLICATION_API_ENDPOINT = `${API_BASE}/api/application`;
export const COMPANY_API_ENDPOINT = `${API_BASE}/api/company`;
export const AI_API_ENDPOINT = `${API_BASE}/api/ai`;
