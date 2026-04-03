import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { FileText, MessageSquare, TrendingUp, Award, ChevronRight, Clock, Star, Flame, Zap, ArrowUpRight, BarChart2, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import useDashboard from "../hooks/useDashboard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { SkeletonDashboard } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/EmptyState";

/* ── Animated counter ── */
const useCountUp = (target, duration = 1200, delay = 200) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf, start = null;
    const timeout = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return val;
};

/* ── 3D tilt card ── */
const TiltCard = ({ children, className = "" }) => {
  const ref = useRef();
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);
  const sRotX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const sRotY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX: sRotX, rotateY: sRotY, transformStyle: "preserve-3d", perspective: 800 }}
      className={className}>
      {children}
    </motion.div>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: "rgba(6,6,16,0.98)", border: "1px solid rgba(255,255,255,0.09)" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
          {p.value} {p.dataKey === "score" ? "pts" : "sessions"}
        </p>
      ))}
    </div>
  );
};

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,.3,1] } } };

const STAT_CONFIGS = [
  { icon: Award,         label: "Resume Score",    key: "score",           suffix: "/100", color: "#6366f1", glow: "rgba(99,102,241,0.35)",  bg: "rgba(99,102,241,0.12)"  },
  { icon: MessageSquare, label: "Interview Score", key: "interviewScore",  suffix: "/100", color: "#8b5cf6", glow: "rgba(139,92,246,0.35)", bg: "rgba(139,92,246,0.12)" },
  { icon: TrendingUp,    label: "Interviews Done", key: "totalInterviews", suffix: "",     color: "#10b981", glow: "rgba(16,185,129,0.35)",  bg: "rgba(16,185,129,0.12)"  },
  { icon: FileText,      label: "Analyses Done",   key: "totalAnalyses",   suffix: "",     color: "#f59e0b", glow: "rgba(245,158,11,0.35)",  bg: "rgba(245,158,11,0.12)"  },
];

const StatCard = ({ icon: Icon, label, value, suffix, color, glow, bg, delay = 0 }) => {
  const num = useCountUp(parseInt(value) || 0, 1200, 300 + delay);
  return (
    <TiltCard>
      <motion.div variants={fadeUp}
        className="card-interactive h-full relative overflow-hidden"
        whileHover={{ borderColor: `${color}30` }}>
        {/* Subtle glow bg */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`, filter: "blur(20px)" }} />
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: bg, boxShadow: `0 0 20px ${glow}` }}>
            <Icon size={19} style={{ color }} />
          </div>
          <ArrowUpRight size={14} className="text-slate-700" />
        </div>
        <p className="text-3xl font-black text-white mb-1 tabular-nums relative z-10">
          {num}{suffix}
        </p>
        <p className="text-xs text-slate-600 relative z-10">{label}</p>
      </motion.div>
    </TiltCard>
  );
};

/* ── Score ring ── */
const ScoreRing = ({ score, atsScore, formatScore, keywordsScore }) => {
  const r = 46;
  const circ = 2 * Math.PI * r;
  return (
    <motion.div variants={fadeUp} className="card flex flex-col items-center justify-center gap-5 py-8">
      <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Resume Score</p>
      <div className="relative">
        <svg width="120" height="120" className="-rotate-90">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#4f46e5" />
              <stop offset="50%"  stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="9" />
          <motion.circle cx="60" cy="60" r={r} fill="none" strokeWidth="9"
            stroke="url(#ringGrad)" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - score / 100) }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.16,1,.3,1] }}
            style={{ filter: "drop-shadow(0 0 10px rgba(99,102,241,0.7))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white tabular-nums">{score}</span>
          <span className="text-[9px] text-slate-600">/ 100</span>
        </div>
      </div>
      <div className="w-full space-y-2.5 px-2">
        {[["ATS Match", atsScore, "#6366f1"], ["Keywords", keywordsScore, "#8b5cf6"], ["Format", formatScore, "#10b981"]].map(([k, v, c]) => (
          <div key={k}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500">{k}</span>
              <span className="text-slate-300 font-bold">{v}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.16,1,.3,1] }}
                className="h-full rounded-full"
                style={{ background: c, boxShadow: `0 0 8px ${c}80` }} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const ACHIEVEMENTS = [
  { icon: Flame, label: "3-Day Streak",  color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
  { icon: Star,  label: "Top Scorer",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  { icon: Award, label: "Pro Analyst",   color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
];

const Dashboard = () => {
  const { user, result } = useApp();
  const navigate = useNavigate();
  const [activeChart, setActiveChart] = useState("score");

  const {
    loading, error, refetch,
    resumeScore, interviewScore, totalAnalyses, totalInterviews,
    trend, atsScore, formatScore, keywordsScore,
    detectedSkills, missingSkills,
  } = useDashboard();

  const score = result?.score ?? resumeScore;

  if (loading) return <SkeletonDashboard />;
  if (error) return (
    <div className="card mt-4"><ErrorState message={error} onRetry={refetch} /></div>
  );

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 pb-6">

      {/* Welcome banner */}
      <motion.div variants={fadeUp}
        className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(6,182,212,0.12) 50%, rgba(139,92,246,0.1) 100%)",
          border: "1px solid rgba(99,102,241,0.18)",
          boxShadow: "0 0 60px rgba(99,102,241,0.08)",
        }}>
        <div className="absolute right-0 top-0 w-72 h-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at right, rgba(99,102,241,0.12), transparent)" }} />
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-slate-500 text-xs font-medium mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 className="text-xl font-black text-white">
            Welcome back, <span className="gradient-text">{user?.name || "User"}</span> 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1">Track your resume and interview performance below.</p>
        </div>
        <Button onClick={() => navigate("/upload")} icon={<FileText size={15} />} className="hidden sm:flex flex-shrink-0">
          New Analysis
        </Button>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIGS.map(({ icon, label, key, suffix, color, glow, bg }, i) => {
          const value = key === "score" ? score : key === "interviewScore" ? interviewScore : key === "totalInterviews" ? totalInterviews : totalAnalyses;
          return <StatCard key={label} icon={icon} label={label} value={value} suffix={suffix} color={color} glow={glow} bg={bg} delay={i * 80} />;
        })}
      </motion.div>

      {/* Chart + Score ring */}
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Performance Trend</h3>
              <p className="text-xs text-slate-600 mt-0.5">Last 7 days</p>
            </div>
            <div className="flex gap-1 p-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {["score", "interviews"].map(k => (
                <button key={k} onClick={() => setActiveChart(k)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200
                    ${activeChart === k ? "text-white" : "text-slate-600 hover:text-slate-400"}`}
                  style={activeChart === k ? { background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.3)" } : {}}>
                  {k === "score" ? "Score" : "Sessions"}
                </button>
              ))}
            </div>
          </div>
          {trend.every(d => d[activeChart] === 0) ? (
            <div className="flex flex-col items-center justify-center h-44 gap-3">
              <BarChart2 size={32} className="text-slate-700" />
              <p className="text-xs text-slate-600">No data yet — upload a resume to start tracking</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trend} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey={activeChart} stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#areaGrad)" dot={false}
                  activeDot={{ r: 5, fill: "#818cf8", stroke: "#4f46e5", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <ScoreRing score={score} atsScore={atsScore} formatScore={formatScore} keywordsScore={keywordsScore} />
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Skills */}
        <motion.div variants={fadeUp} className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
              <Target size={13} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Skill Overview</h3>
          </div>
          <div className="mb-4">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 font-bold">Detected</p>
            <div className="flex flex-wrap gap-1.5">
              {detectedSkills.length
                ? detectedSkills.map(s => <Badge key={s} label={s} variant="green" icon="✓" />)
                : <p className="text-xs text-slate-600">Upload a resume to see skills</p>
              }
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 font-bold">Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.length
                ? missingSkills.map(s => <Badge key={s} label={s} variant="red" icon="✕" />)
                : <p className="text-xs text-slate-600">—</p>
              }
            </div>
          </div>
        </motion.div>

        {/* Activity */}
        <motion.div variants={fadeUp} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
                <Clock size={13} className="text-primary-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Recent Activity</h3>
            </div>
          </div>
          {totalAnalyses === 0 && totalInterviews === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Zap size={24} className="text-slate-700" />
              <p className="text-xs text-slate-600 text-center">No activity yet. Upload a resume to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {totalAnalyses > 0 && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.15)" }}>📄</div>
                  <div>
                    <p className="text-xs text-white font-semibold">{totalAnalyses} resume{totalAnalyses > 1 ? "s" : ""} analyzed</p>
                    <p className="text-[10px] text-slate-600">AI-powered analysis complete</p>
                  </div>
                </motion.div>
              )}
              {totalInterviews > 0 && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: "rgba(139,92,246,0.15)" }}>🎯</div>
                  <div>
                    <p className="text-xs text-white font-semibold">{totalInterviews} interview{totalInterviews > 1 ? "s" : ""} completed</p>
                    <p className="text-[10px] text-slate-600">Mock interview sessions</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick actions + achievements */}
        <motion.div variants={fadeUp} className="card space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Achievements</h3>
            <div className="flex gap-2">
              {ACHIEVEMENTS.map(({ icon: Icon, label, color, bg }) => (
                <motion.div key={label} whileHover={{ y: -3, scale: 1.05 }}
                  className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer"
                  style={{ background: bg, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Icon size={16} style={{ color }} />
                  <p className="text-[9px] text-slate-400 font-bold text-center leading-tight">{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Quick Actions</h3>
            <div className="space-y-1.5">
              {[
                { label: "Upload Resume",   to: "/upload",    emoji: "📄", color: "#6366f1" },
                { label: "Start Interview", to: "/interview", emoji: "🎤", color: "#8b5cf6" },
                { label: "View Results",    to: "/results",   emoji: "📊", color: "#10b981" },
              ].map(({ label, to, emoji, color }) => (
                <motion.button key={to} onClick={() => navigate(to)}
                  whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all duration-200 group"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${color}30`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}>
                  <span className="text-base">{emoji}</span>
                  <span className="flex-1 text-left font-semibold text-xs">{label}</span>
                  <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
