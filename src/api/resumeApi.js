import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ── Axios instance with auth token injection ──
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        localStorage.setItem("accessToken",  data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const registerUser = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  localStorage.setItem("accessToken",  data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  return data.user;
};

export const loginUser = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  localStorage.setItem("accessToken",  data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  return data.user;
};

export const logoutUser = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const getMe = async () => {
  const { data } = await api.get("/auth/me");
  return data.user;
};

export const updateProfile = async ({ name }) => {
  const { data } = await api.put("/auth/profile", { name });
  return data.user;
};

export const updateContact = async (payload) => {
  const { data } = await api.put("/auth/contact", payload);
  return data.user;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await api.put("/auth/change-password", { currentPassword, newPassword });
  return data;
};

// ─────────────────────────────────────────────
// RESUME  (backward-compatible with existing UploadPage)
// Old: POST /upload-resume  →  New: POST /api/resume/upload
// ─────────────────────────────────────────────
export const uploadResume = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/resume/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return data;
};

export const getResumeHistory = async () => {
  const { data } = await api.get("/resume/history");
  return data.resumes;
};

export const getResumeById = async (id) => {
  const { data } = await api.get(`/resume/${id}`);
  const a = data.resume?.analysis || {};
  return {
    score:           a.score ?? 0,
    atsScore:        a.atsScore ?? 0,
    formatScore:     a.formatScore ?? 0,
    keywordsScore:   a.keywordsScore ?? 0,
    extractedSkills: a.extractedSkills ?? [],
    missingSkills:   a.missingSkills ?? [],
    suggestions:     a.suggestions ?? [],
    radarData:       a.radarData ?? [],
    resumeId:        data.resume?._id,
    changes:         data.resume?.changes || null,
  };
};

// ─────────────────────────────────────────────
// AI
// Old: POST /interview/question  →  New: POST /api/ai/question
// ─────────────────────────────────────────────
export const getInterviewQuestion = async (context) => {
  const { data } = await api.post("/ai/question", context);
  return data;
};

export const evaluateAnswer = async ({ question, answer, track }) => {
  const { data } = await api.post("/ai/evaluate", { question, answer, track });
  return data;
};

export const getPerfectAnswer = async ({ question, track, userAnswer }) => {
  const { data } = await api.post("/ai/perfect-answer", { question, track, userAnswer });
  return data;
};

// ─────────────────────────────────────────────
// INTERVIEW SESSIONS
// ─────────────────────────────────────────────
export const createInterviewSession = async ({ track, difficulty }) => {
  const { data } = await api.post("/interview/session", { track, difficulty });
  return data;
};

export const completeInterviewSession = async (sessionId, report) => {
  const { data } = await api.post(`/interview/session/${sessionId}/complete`, report);
  return data;
};

export const getInterviewHistory = async () => {
  const { data } = await api.get("/interview/history");
  return data.sessions;
};

export const getInterviewSession = async (id) => {
  const { data } = await api.get(`/interview/session/${id}`);
  return data;
};

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
export const getDashboardStats = async () => {
  const { data } = await api.get("/dashboard/stats");
  return data;
};

export const getPublicStats = async () => {
  const { data } = await api.get("/dashboard/public-stats");
  return data;
};

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────
export const adminGetStats       = async ()         => { const { data } = await api.get("/admin/stats");                    return data; };
export const adminGetUsers       = async (p = 1, s) => { const { data } = await api.get(`/admin/users?page=${p}&search=${s || ""}`); return data; };
export const adminDeleteUser     = async (id)       => { const { data } = await api.delete(`/admin/users/${id}`);           return data; };
export const adminGetResumes     = async (p = 1)    => { const { data } = await api.get(`/admin/resumes?page=${p}`);        return data; };
export const adminDeleteResume   = async (id)       => { const { data } = await api.delete(`/admin/resumes/${id}`);         return data; };
export const adminGetInterviews  = async (p = 1)    => { const { data } = await api.get(`/admin/interviews?page=${p}`);     return data; };
export const adminDeleteInterview= async (id)       => { const { data } = await api.delete(`/admin/interviews/${id}`);      return data; };
// ─────────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────────
export const submitFeedback = async ({ rating, category, message }) => {
  const { data } = await api.post("/feedback", { rating, category, message });
  return data;
};

export const adminSearchSkill    = async (skill)    => { const { data } = await api.get(`/admin/skills/search?skill=${encodeURIComponent(skill)}`); return data; };
export const adminGetTopSkills   = async ()         => { const { data } = await api.get("/admin/skills/top");               return data; };
export const adminSetPremium     = async (userId, isPremium) => { const { data } = await api.put("/auth/premium", { userId, isPremium }); return data; };

// ─────────────────────────────────────────────
// CLIENT-SIDE SCORING (kept for offline/fallback use in useScoring.js)
// ─────────────────────────────────────────────
export const scoreAnswer = (answer, question, category = "general") => {
  const KEYWORD_BANK = {
    technical:  ["algorithm","architecture","api","database","framework","performance","scalable","deploy","debug","optimize","code","system","stack","backend","frontend","cloud","testing","ci/cd","git","agile"],
    behavioral: ["team","collaborate","challenge","solution","leadership","communication","conflict","deadline","initiative","responsibility","impact","result","learned","improved","managed","delivered"],
    situational:["would","approach","prioritize","handle","strategy","plan","consider","evaluate","decision","stakeholder","risk","outcome","process","step","ensure"],
    general:    ["experience","skill","project","role","goal","achieve","growth","passion","value","contribute","professional","background","strength","weakness","future"],
  };
  const safeAnswer  = String(answer || "");
  const safeQuestion = String(question || "");
  const words       = safeAnswer.trim().split(/\s+/).filter(Boolean);
  const wc          = words.length;
  const lower       = safeAnswer.toLowerCase();
  const qLower      = safeQuestion.toLowerCase();
  const qWords      = qLower.split(/\s+/).filter(w => w.length > 4);
  const overlap     = qWords.filter(w => lower.includes(w)).length;
  const relevance   = Math.min(25, Math.round((overlap / Math.max(qWords.length, 1)) * 25) + (wc > 10 ? 5 : 0));
  const depth       = wc < 20 ? 5 : wc < 40 ? 12 : wc < 70 ? 18 : wc < 120 ? 22 : 25;
  const bank        = [...(KEYWORD_BANK[category] || []), ...KEYWORD_BANK.general];
  const hits        = bank.filter(k => lower.includes(k)).length;
  const keywords    = Math.min(25, hits * 4);
  const sentences   = safeAnswer.split(/[.!?]+/).filter(s => s.trim().length > 3).length;
  const fillers     = (lower.match(/\b(um|uh|like|basically|literally|you know|i mean)\b/g) || []).length;
  const avgLen      = wc / Math.max(sentences, 1);
  const clarityBase = sentences >= 2 && avgLen >= 8 && avgLen <= 25 ? 20 : 12;
  const clarity     = Math.max(0, Math.min(25, clarityBase - fillers * 3 + (sentences >= 3 ? 5 : 0)));
  return { total: Math.min(100, relevance + depth + keywords + clarity), breakdown: { relevance, depth, keywords, clarity }, wordCount: wc };
};

export default api;
