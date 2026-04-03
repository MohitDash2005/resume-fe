import api from "../api/resumeApi";

export const authService = {
  login:          ({ email, password })               => api.post("/auth/login",            { email, password }).then(r => r.data),
  register:       ({ name, email, password })         => api.post("/auth/register",         { name, email, password }).then(r => r.data),
  logout:         ()                                  => api.post("/auth/logout").then(r => r.data),
  me:             ()                                  => api.get("/auth/me").then(r => r.data.user),
  updateProfile:  ({ name })                          => api.put("/auth/profile",            { name }).then(r => r.data.user),
  changePassword: ({ currentPassword, newPassword })  => api.put("/auth/change-password",   { currentPassword, newPassword }).then(r => r.data),
  publicStats:    ()                                  => api.get("/dashboard/public-stats").then(r => r.data),
};
