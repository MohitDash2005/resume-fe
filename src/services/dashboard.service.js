import api from "../api/resumeApi";

export const dashboardService = {
  stats: () => api.get("/dashboard/stats").then(r => r.data),
};

export const interviewService = {
  createSession:   ({ track, difficulty })    => api.post("/interview/session", { track, difficulty }).then(r => r.data),
  completeSession: (sessionId, report)        => api.post(`/interview/session/${sessionId}/complete`, report).then(r => r.data),
  history:         ()                         => api.get("/interview/history").then(r => r.data.sessions),
  getQuestion:     (context)                  => api.post("/ai/question", context).then(r => r.data),
  evaluateAnswer:  ({ question, answer, track }) => api.post("/ai/evaluate", { question, answer, track }).then(r => r.data),
};

export const adminService = {
  stats:           ()         => api.get("/admin/stats").then(r => r.data),
  users:           (p = 1, s) => api.get(`/admin/users?page=${p}&search=${s || ""}`).then(r => r.data),
  setPremium:      (id, isPremium) => api.put("/auth/premium", { userId: id, isPremium }).then(r => r.data),
  deleteUser:      (id)       => api.delete(`/admin/users/${id}`).then(r => r.data),
  resumes:         (p = 1)    => api.get(`/admin/resumes?page=${p}`).then(r => r.data),
  deleteResume:    (id)       => api.delete(`/admin/resumes/${id}`).then(r => r.data),
  interviews:      (p = 1)    => api.get(`/admin/interviews?page=${p}`).then(r => r.data),
  interviewDetail: (id)       => api.get(`/admin/interviews/${id}`).then(r => r.data),
  deleteInterview: (id)       => api.delete(`/admin/interviews/${id}`).then(r => r.data),
  searchSkill:     (skill)    => api.get(`/admin/skills/search?skill=${encodeURIComponent(skill)}`).then(r => r.data),
  topSkills:       ()         => api.get("/admin/skills/top").then(r => r.data),
  feedback:        (p = 1)    => api.get(`/admin/feedback?page=${p}`).then(r => r.data),
  deleteFeedback:  (id)       => api.delete(`/admin/feedback/${id}`).then(r => r.data),
  pinFeedback:     (id)       => api.patch(`/admin/feedback/${id}/pin`).then(r => r.data),
};
