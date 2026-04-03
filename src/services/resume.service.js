import api from "../api/resumeApi";

export const resumeService = {
  upload: (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/resume/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }).then(r => r.data);
  },

  history: () => api.get("/resume/history").then(r => r.data.resumes),

  getById: (id) => api.get(`/resume/${id}`).then(r => {
    const a = r.data.resume?.analysis || {};
    return {
      score:           a.score ?? 0,
      atsScore:        a.atsScore ?? 0,
      formatScore:     a.formatScore ?? 0,
      keywordsScore:   a.keywordsScore ?? 0,
      extractedSkills: a.extractedSkills ?? [],
      missingSkills:   a.missingSkills ?? [],
      suggestions:     a.suggestions ?? [],
      radarData:       a.radarData ?? [],
      resumeId:        r.data.resume?._id,
      filename:        r.data.resume?.filename,
      createdAt:       r.data.resume?.createdAt,
      changes:         r.data.resume?.changes || null,
    };
  }),
};
