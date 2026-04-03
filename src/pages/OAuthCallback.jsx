import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMe } from "../api/resumeApi";
import { useApp } from "../context/AppContext";

const OAuthCallback = () => {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { setUser } = useApp();

  useEffect(() => {
    const accessToken  = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const error        = params.get("error");

    if (error || !accessToken) {
      navigate("/login?error=oauth_failed");
      return;
    }

    localStorage.setItem("accessToken",  accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    getMe()
      .then(user => { setUser(user); navigate("/dashboard"); })
      .catch(() => navigate("/login?error=oauth_failed"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080810]">
      <div className="flex flex-col items-center gap-4">
        <span className="w-8 h-8 border-2 border-white/10 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Signing you in...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
