import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, logoutUser, getMe, getResumeHistory, getResumeById } from "../api/resumeApi";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [result, setResult]                   = useState(null);
  const [interviewReport, setInterviewReport] = useState(null);
  const [authLoading, setAuthLoading]         = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Restore latest resume from backend whenever user is set
  // Uses history endpoint so it always fetches THIS user's resume — no localStorage dependency
  useEffect(() => {
    if (!user) return;
    getResumeHistory()
      .then(async (resumes) => {
        if (!resumes?.length) return;
        const latest = resumes[0]; // already sorted by createdAt desc
        const full = await getResumeById(latest._id);
        setResult(full);
        if (full?.resumeId) localStorage.setItem("lastResumeId", full.resumeId);
      })
      .catch(() => {}); // silently ignore — user just won't see results until they upload
  }, [user]); // eslint-disable-line

  const setResultAndPersist = (data) => {
    if (data?.resumeId) localStorage.setItem("lastResumeId", data.resumeId);
    setResult(data);
  };

  const login = async (payload) => {
    const userData = await loginUser(payload);
    setUser(userData);
    return userData;
  };

  const register = async (payload) => {
    const userData = await registerUser(payload);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try { await logoutUser(); } catch {}
    setUser(null);
    setResult(null);
    setInterviewReport(null);
    localStorage.removeItem("lastResumeId");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AppContext.Provider value={{
      user, authLoading,
      login, register, logout,
      setUser,
      result, setResult: setResultAndPersist,
      interviewReport, setInterviewReport,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
