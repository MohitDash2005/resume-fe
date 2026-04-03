import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileText, Clock, ChevronRight, BarChart2, MessageSquare,
  ChevronDown, ChevronUp, Award, Trophy, TrendingUp,
} from "lucide-react";
import useResumeHistory from "../hooks/useResumeHistory";
import { useApp } from "../context/AppContext";
import { getInterviewHistory, getInterviewSession } from "../api/resumeApi";

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,.3,1] } } };

const scoreColor = (s) => s >= 75 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";
const gradeColor = (g) => ({ A: "#10b981", B: "#6366f1", C: "#f59e0b", D: "#f97316", F: "#ef4444" }[g] || "#94a3b8");
const formatDuration = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

/* ── Best score banner ── */
const BestScoreBanner = ({ sessions }) => {
  const best = sessions.reduce((b, s) => s.overallScore > (b?.overallScore || 0) ? s : b, null);
  if (!best) return null;
  const color = scoreColor(best.overallScore);
  const avg   = Math.round(sessions.reduce((sum, s) => sum + s.overallScore, 0) / sessions.length);

  return (
    <motion.div variants={fadeUp}
      className="relative overflow-hidden rounded-2xl p-5 flex items-center justify-between gap-4"
      style={{
        background: `linear-gradient(135deg, ${color}12 0%, rgba(99,102,241,0.08) 100%)`,
        border: `1px solid ${color}25`,
      }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at left, ${color}10, transparent 60%)` }} />

      {/* Best score */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Trophy size={22} style={{ color }} />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Personal Best</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tabular-nums" style={{ color }}>{best.overallScore}</span>
            <span className="text-slate-600 text-sm">/100</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-lg ml-1"
              style={{ color: gradeColor(best.grade), background: `${gradeColor(best.grade)}18` }}>
              {best.grade}
            </span>
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5">{best.track} · {best.difficulty}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 relative z-10 flex-shrink-0">
        <div className="text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-0.5">Sessions</p>
          <p className="text-xl font-black text-white">{sessions.length}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-0.5">Avg Score</p>
          <p className="text-xl font-black tabular-nums" style={{ color: scoreColor(avg) }}>{avg}</p>
        </div>
        <div className="text-center hidden sm:block">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-0.5">Trend</p>
          <TrendingUp size={20} style={{ color: sessions[0]?.overallScore >= avg ? "#10b981" : "#f59e0b" }} />
        </div>
      </div>
    </motion.div>
  );
};

/* ── Per-question inline history ── */
const QuestionHistory = ({ answers }) => {
  const [expanded, setExpanded] = useState(null);
  if (!answers?.length) return (
    <p className="text-[10px] text-slate-600 px-4 pb-3">No per-question data saved.</p>
  );
  return (
    <div className="px-3 pb-3 space-y-1.5">
      {answers.map((a, i) => {
        const color = scoreColor(a.score);
        const open  = expanded === i;
        return (
          <div key={i} className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${open ? color + "30" : "rgba(255,255,255,0.05)"}`, background: "rgba(255,255,255,0.02)" }}>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
              onClick={() => setExpanded(open ? null : i)}>
              <span className="text-[9px] font-bold text-slate-600 w-5 flex-shrink-0">Q{i + 1}</span>
              <p className="flex-1 text-[11px] text-slate-400 truncate">{a.question}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mini score bar */}
                <div className="flex items-center gap-1.5">
                  <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${a.score}%`, background: color }} />
                  </div>
                  <span className="text-xs font-black tabular-nums" style={{ color }}>{a.score}</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: gradeColor(a.grade), background: `${gradeColor(a.grade)}15` }}>
                  {a.grade}
                </span>
                {open ? <ChevronUp size={11} className="text-slate-600" /> : <ChevronDown size={11} className="text-slate-600" />}
              </div>
            </button>

            <AnimatePresence>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="pt-2">
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">Your Answer</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{a.answer || "—"}</p>
                    </div>
                    {a.breakdown && (
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1.5">Breakdown</p>
                        <div className="grid grid-cols-2 gap-1">
                          {Object.entries(a.breakdown).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between px-2 py-1 rounded-lg"
                              style={{ background: "rgba(255,255,255,0.03)" }}>
                              <span className="text-[9px] text-slate-500 capitalize">{k}</span>
                              <span className="text-[9px] font-bold text-white">{v}/25</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {a.feedback?.length > 0 && (
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">Feedback</p>
                        {a.feedback.slice(0, 2).map((f, fi) => (
                          <p key={fi} className="text-[10px] text-slate-400 leading-relaxed">• {f}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

/* ── Session row with expandable history ── */
const SessionRow = ({ s }) => {
  const [open, setOpen]         = useState(false);
  const [answers, setAnswers]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const color  = scoreColor(s.overallScore);
  const gColor = gradeColor(s.grade);

  const toggle = async () => {
    if (!open && answers === null) {
      setLoading(true);
      try {
        const res = await getInterviewSession(s._id);
        setAnswers(res.session?.answers || []);
      } catch { setAnswers([]); }
      setLoading(false);
    }
    setOpen(o => !o);
  };

  return (
    <motion.div variants={fadeUp}
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${open ? color + "25" : "rgba(255,255,255,0.06)"}`,
      }}>
      {/* Row header */}
      <button className="w-full flex items-center gap-4 px-4 py-3.5 text-left" onClick={toggle}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.12)" }}>
          <MessageSquare size={16} className="text-violet-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{s.track}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-600">{s.difficulty}</span>
            <span className="text-slate-700">·</span>
            <Clock size={10} className="text-slate-600" />
            <p className="text-[10px] text-slate-600">
              {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            {s.duration > 0 && (
              <><span className="text-slate-700">·</span>
              <p className="text-[10px] text-slate-600">{formatDuration(s.duration)}</p></>
            )}
          </div>
        </div>

        {/* Score + grade */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-lg font-black tabular-nums" style={{ color }}>{s.overallScore}</p>
            <p className="text-[9px] text-slate-600">/ 100</p>
          </div>
          <span className="text-xs font-black px-2 py-1 rounded-lg"
            style={{ color: gColor, background: `${gColor}18` }}>
            {s.grade}
          </span>
          {open
            ? <ChevronUp size={14} className="text-slate-500" />
            : <ChevronRight size={14} className="text-slate-700" />}
        </div>
      </button>

      {/* Expandable per-question history */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-white/10 border-t-violet-400 rounded-full animate-spin" />
              </div>
            ) : (
              <QuestionHistory answers={answers} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Main page ── */
const HistoryPage = () => {
  const navigate = useNavigate();
  const { setResult } = useApp();
  const [tab, setTab] = useState("resume");

  const { resumes, loading: rLoading, error: rError, fetched: rFetched, refetch: rRefetch } = useResumeHistory();

  const [sessions, setSessions] = useState([]);
  const [iLoading, setILoading] = useState(false);
  const [iError, setIError]     = useState(null);
  const [iFetched, setIFetched] = useState(false);

  const fetchInterviews = useCallback(async () => {
    setILoading(true); setIError(null);
    try {
      const data = await getInterviewHistory();
      setSessions(data || []);
      setIFetched(true);
    } catch (e) {
      setIError(e?.response?.data?.error || "Failed to load interview history");
    } finally { setILoading(false); }
  }, []);

  useEffect(() => { if (!rFetched) rRefetch(); }, [rFetched, rRefetch]);
  useEffect(() => { if (tab === "interview" && !iFetched) fetchInterviews(); }, [tab, iFetched, fetchInterviews]);

  const openResume = async (id) => {
    const { resumeService } = await import("../services/resume.service");
    const data = await resumeService.getById(id);
    setResult(data);
    navigate("/results");
  };

  const TABS = [
    { key: "resume",    label: "Resume Analyses",    icon: FileText,      count: resumes.length },
    { key: "interview", label: "Interview Sessions",  icon: MessageSquare, count: sessions.length },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5 pb-6">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">History</h2>
          <p className="text-xs text-slate-600 mt-0.5">All your past activity</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
              ${tab === key ? "text-white" : "text-slate-600 hover:text-slate-400"}`}
            style={tab === key ? { background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.3)" } : {}}>
            <Icon size={12} />
            {label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
              {count}
            </span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── Resume tab ── */}
        {tab === "resume" && (
          <motion.div key="resume" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {rLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            )}
            {rError && (
              <div className="card text-center py-10">
                <p className="text-red-400 text-sm mb-3">{rError}</p>
                <button onClick={rRefetch} className="text-xs text-primary-400 hover:underline">Retry</button>
              </div>
            )}
            {!rLoading && !rError && resumes.length === 0 && (
              <div className="card flex flex-col items-center justify-center py-16 gap-4">
                <BarChart2 size={36} className="text-slate-700" />
                <p className="text-slate-500 text-sm">No analyses yet</p>
                <button onClick={() => navigate("/upload")} className="text-xs font-semibold text-primary-400 hover:underline">
                  Upload your first resume →
                </button>
              </div>
            )}
            {!rLoading && resumes.length > 0 && (
              <div className="space-y-2.5">
                {resumes.map((r) => {
                  const score = r.analysis?.score ?? 0;
                  const color = scoreColor(score);
                  return (
                    <motion.div key={r._id} variants={fadeUp}
                      onClick={() => openResume(r._id)}
                      whileHover={{ x: 3 }}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 group"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = `${color}30`}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(99,102,241,0.12)" }}>
                        <FileText size={16} className="text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.filename}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} className="text-slate-600" />
                          <p className="text-[10px] text-slate-600">
                            {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-black tabular-nums" style={{ color }}>{score}</p>
                          <p className="text-[9px] text-slate-600">/ 100</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Interview tab ── */}
        {tab === "interview" && (
          <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4">
            {iLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            )}
            {iError && (
              <div className="card text-center py-10">
                <p className="text-red-400 text-sm mb-3">{iError}</p>
                <button onClick={fetchInterviews} className="text-xs text-primary-400 hover:underline">Retry</button>
              </div>
            )}
            {!iLoading && !iError && sessions.length === 0 && (
              <div className="card flex flex-col items-center justify-center py-16 gap-4">
                <MessageSquare size={36} className="text-slate-700" />
                <p className="text-slate-500 text-sm">No interview sessions yet</p>
                <button onClick={() => navigate("/interview")} className="text-xs font-semibold text-primary-400 hover:underline">
                  Start your first interview →
                </button>
              </div>
            )}
            {!iLoading && sessions.length > 0 && (
              <>
                {/* Best score banner */}
                <BestScoreBanner sessions={sessions} />

                {/* Session list */}
                <motion.div variants={stagger} className="space-y-2.5">
                  {sessions.map(s => <SessionRow key={s._id} s={s} />)}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HistoryPage;
