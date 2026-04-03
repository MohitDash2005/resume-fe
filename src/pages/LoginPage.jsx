import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, BarChart2, Zap, Shield,
  Star, TrendingUp, CheckCircle, Users, Award,
} from "lucide-react";
import AnimatedBackground from "../components/ui/AnimatedBackground";
import AuthPanel from "../components/auth/AuthPanel";
import { getPublicStats } from "../api/resumeApi";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const FEATURES = [
  { icon: BarChart2, color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.2)",  title: "AI Resume Scoring",   sub: "Instant ATS & quality scores powered by GPT-4" },
  { icon: Zap,       color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)",  title: "Skill Gap Analysis",  sub: "Know exactly what skills you're missing" },
  { icon: Shield,    color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.2)",  title: "Interview Practice",  sub: "AI-powered mock interviews in real-time" },
];

const STATS = [
  { icon: Users,    color: "#6366f1", label: "Professionals", key: "totalUsers",   fallback: "16+", suffix: "+" },
  { icon: Award,    color: "#10b981", label: "Avg Score Boost", value: "34%",      fallback: "34%" },
  { icon: TrendingUp, color: "#f59e0b", label: "Resumes Analyzed", key: "totalResumes", fallback: "5+", suffix: "+" },
];

const LoginPage = () => {
  const [publicStats, setPublicStats] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [testiIdx, setTestiIdx]         = useState(0);
  const navigate = useNavigate();

  useEffect(() => { getPublicStats().then(setPublicStats).catch(() => {}); }, []);

  useEffect(() => {
    axios.get(`${API_BASE}/feedback/pinned`)
      .then(r => setTestimonials(r.data.feedback || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (testimonials.length < 2) return;
    const t = setInterval(() => setTestiIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials]);

  const handleSuccess = (isAdmin = false) =>
    navigate(isAdmin ? "/admin" : "/dashboard");

  const testi = testimonials[testiIdx];

  return (
    <div className="flex bg-[#02020a] overflow-x-hidden">

      {/* ── LEFT PANEL (50%) — scrollable ── */}
      <div className="hidden lg:block w-1/2 min-h-screen overflow-y-auto relative z-10"
        style={{ maxHeight: "100vh" }}>
        <AnimatedBackground>
          <div className="flex flex-col justify-center min-h-screen px-16 xl:px-20">
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10 max-w-lg"
            >
              {/* Back */}
              <motion.button whileHover={{ x: -3 }} onClick={() => navigate("/")}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-300 transition-colors text-xs w-fit">
                <ArrowLeft size={13} /> Back to home
              </motion.button>

              {/* Logo + headline */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)", boxShadow: "0 0 28px rgba(99,102,241,0.5)" }}>
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-base leading-tight">Smart Resume Analyzer</p>
                    <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">AI Career Platform</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] mb-3">
                    Land your<br />
                    <span className="gradient-text-hero">dream job faster</span>
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    AI-powered resume analysis, skill gap detection, and interview coaching — everything you need to stand out.
                  </p>
                </div>
              </div>

              {/* Feature list */}
              <div className="space-y-3">
                {FEATURES.map(({ icon: Icon, color, bg, border, title, sub }, i) => (
                  <motion.div key={title}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.1 }}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl group"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 0 14px ${color}25` }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="text-[11px] text-slate-500">{sub}</p>
                    </div>
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 opacity-70" />
                  </motion.div>
                ))}
              </div>

              {/* Testimonial */}
              <AnimatePresence mode="wait">
                <motion.div key={testiIdx}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="relative overflow-hidden p-6 rounded-[28px]"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.14), rgba(6,182,212,0.08))", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 18px 50px rgba(2,6,23,0.3)" }}>
                  <div
                    className="absolute -right-10 -top-10 w-32 h-32 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)" }}
                  />
                  <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[10px] text-indigo-300/80 font-bold tracking-[0.22em] uppercase">Success Story</p>
                      <p className="text-sm font-bold text-white mt-1">What users are saying</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-300"
                      style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.2)" }}>
                      Real feedback
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11}
                        fill={i < (testi?.rating ?? 5) ? "#f59e0b" : "transparent"}
                        style={{ color: i < (testi?.rating ?? 5) ? "#f59e0b" : "rgba(255,255,255,0.12)" }} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic mb-4">
                    "{testi?.message || "Got 3 interview calls within a week after fixing my resume. The skill gap analysis was a game changer."}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)", boxShadow: "0 0 12px rgba(99,102,241,0.4)" }}>
                      {testi?.user?.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{testi?.user?.name || "Sarah K."}</p>
                      <p className="text-[10px] text-slate-600">Resume Analyzer user</p>
                    </div>
                    {testimonials.length > 1 && (
                      <div className="ml-auto flex gap-1.5">
                        {testimonials.map((_, i) => (
                          <button key={i} onClick={() => setTestiIdx(i)}
                            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                            style={{ background: i === testiIdx ? "#6366f1" : "rgba(255,255,255,0.15)" }} />
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Stats row */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-3">
                {STATS.map(({ icon: Icon, color, label, key, value, fallback, suffix }) => {
                  const raw = key ? publicStats?.[key] : null;
                  const display = value || (raw ? `${raw.toLocaleString()}${suffix || ""}` : fallback);
                  return (
                    <div key={label} className="flex flex-col items-center gap-2 py-4 px-3 rounded-[24px] text-center"
                      style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${color}18`, border: `1px solid ${color}20` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <p className="text-lg font-black text-white tabular-nums leading-none">{display}</p>
                      <p className="text-[10px] text-slate-500 leading-tight uppercase tracking-[0.16em]">{label}</p>
                    </div>
                  );
                })}
              </motion.div>

            </motion.div>
          </div>
        </AnimatedBackground>
      </div>

      {/* ── RIGHT PANEL (50%) — fixed/sticky ── */}
      <div className="w-full lg:w-1/2 min-h-screen relative lg:sticky lg:top-0 lg:h-screen">
        <AuthPanel onSuccess={handleSuccess} />
      </div>

    </div>
  );
};

export default LoginPage;
