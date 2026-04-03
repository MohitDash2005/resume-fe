import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Share2, CheckCircle, XCircle, Lightbulb, BarChart2, Copy, Check, X, Sparkles, TrendingUp, TrendingDown, GitCompare } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useApp } from "../context/AppContext";
import CircularProgress from "../components/ui/CircularProgress";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { SkeletonResult } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";

const BASE_TABS = ["Overview", "Skills", "Suggestions"];

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,.3,1] } } };

/* ── Share modal ── */
const ShareModal = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }} transition={{ ease: [0.16,1,.3,1] }}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: "rgba(6,6,16,0.99)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Share Results</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="flex-1 text-xs text-slate-500 truncate">{url}</p>
          <button onClick={copy}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: copied ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)", color: copied ? "#34d399" : "#818cf8" }}>
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["LinkedIn", "Twitter", "Email"].map(p => (
            <button key={p}
              className="py-2.5 rounded-xl text-xs text-slate-400 font-semibold transition-all hover:text-white hover:bg-white/5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {p}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Score grade badge ── */
const GradeBadge = ({ score }) => {
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";
  const color  = score >= 85 ? "#10b981" : score >= 70 ? "#6366f1" : score >= 55 ? "#f59e0b" : "#ef4444";
  const label  = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 55 ? "Average" : "Needs Work";
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <span className="text-sm font-black" style={{ color }}>{grade}</span>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  );
};

const ResultPage = () => {
  const { result, authLoading } = useApp();
  const navigate = useNavigate();
  const [tab, setTab]           = useState(0);
  const [showShare, setShowShare] = useState(false);

  if (authLoading) return <SkeletonResult />;

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          icon="📄"
          title="No analysis found"
          message="Upload your resume to get an AI-powered score, skill gap analysis, and improvement suggestions."
          action={() => navigate("/upload")}
          actionLabel="Upload Resume"
        />
      </div>
    );
  }

  const { score, atsScore = 0, formatScore = 0, keywordsScore = 0,
          extractedSkills = [], missingSkills = [], suggestions = [], radarData = [],
          changes } = result;

  const TABS = changes?.hasPrevious
    ? [...BASE_TABS, "Changes"]
    : BASE_TABS;

  const skillBarData = [
    ...extractedSkills.map(s => ({ name: s, has: true })),
    ...missingSkills.map(s => ({ name: s, has: false })),
  ];

  return (
    <>
      <AnimatePresence>{showShare && <ShareModal onClose={() => setShowShare(false)} />}</AnimatePresence>

      <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-5 pb-6">

        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/upload")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <ArrowLeft size={16} />
            </motion.button>
            <div>
              <h2 className="text-xl font-black text-white">Analysis Results</h2>
              <p className="text-slate-600 text-xs mt-0.5">AI-powered resume intelligence report</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon={<Share2 size={13} />} className="hidden sm:flex text-xs py-2 px-3"
              onClick={() => setShowShare(true)}>Share</Button>
            <Button variant="outline" icon={<Download size={13} />} className="text-xs py-2 px-3">Export</Button>
          </div>
        </motion.div>

        {/* Score hero + radar */}
        <div className="grid sm:grid-cols-5 gap-4">
          <motion.div variants={fadeUp} className="card sm:col-span-2 flex flex-col items-center justify-center py-8 gap-4">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Overall Score</p>
            <CircularProgress score={score} size={160} />
            <GradeBadge score={score} />
            <div className="flex gap-5 mt-1">
              {[["ATS", atsScore, "#6366f1"], ["Format", formatScore, "#10b981"], ["Keywords", keywordsScore, "#f59e0b"]].map(([k, v, c]) => (
                <div key={k} className="text-center">
                  <p className="text-sm font-black" style={{ color: c }}>{v}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-wide">{k}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="card sm:col-span-3">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-3">Skill Radar</p>
            <ResponsiveContainer width="100%" height={215}>
              <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 10, fontWeight: 600 }} />
                <Tooltip contentStyle={{ background: "rgba(6,6,16,0.98)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, fontSize: 11 }} />
                <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.14} strokeWidth={2}
                  dot={{ fill: "#818cf8", r: 3, strokeWidth: 0 }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div variants={fadeUp}>
          <div className="flex gap-1 p-1 rounded-xl mb-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 relative overflow-hidden
                  ${tab === i ? "text-white" : "text-slate-600 hover:text-slate-400"}`}>
                {tab === i && (
                  <motion.div layoutId="tabIndicator" className="absolute inset-0 rounded-lg"
                    style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.3),rgba(99,102,241,0.2))", border: "1px solid rgba(99,102,241,0.25)" }} />
                )}
                <span className="relative z-10">{t}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 0 && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }} className="space-y-4">
                {/* Skill gap bars */}
                <div className="card">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
                      <BarChart2 size={15} className="text-primary-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Skill Gap Analysis</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                    {skillBarData.map(({ name, has }) => (
                      <div key={name}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className={has ? "text-slate-300 font-semibold" : "text-slate-600"}>{name}</span>
                          <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-md ${has ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
                            {has ? "Present" : "Missing"}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: has ? "100%" : "15%" }}
                            transition={{ duration: 1, delay: 0.2, ease: [0.16,1,.3,1] }}
                            className="h-full rounded-full"
                            style={has
                              ? { background: "linear-gradient(90deg,#10b981,#34d399)", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }
                              : { background: "rgba(239,68,68,0.4)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-scores */}
                <div className="grid grid-cols-3 gap-3">
                  {[["ATS Score", atsScore, "#6366f1"], ["Format", formatScore, "#10b981"], ["Keywords", keywordsScore, "#f59e0b"]].map(([k, v, c]) => (
                    <motion.div key={k} whileHover={{ y: -2 }} className="card text-center">
                      <p className="text-3xl font-black mb-1" style={{ color: c }}>{v}</p>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-2">{k}</p>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="h-full rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}80` }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === 1 && (
              <motion.div key="skills" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }} className="grid sm:grid-cols-2 gap-4">
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle size={15} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Detected Skills</h3>
                    <span className="ml-auto text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">{extractedSkills.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.map((s, i) => (
                      <motion.div key={s} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                        <Badge label={s} variant="green" icon="✓" />
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle size={15} className="text-red-400" />
                    <h3 className="text-sm font-bold text-white">Missing Skills</h3>
                    <span className="ml-auto text-xs text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">{missingSkills.length}</span>
                  </div>
                  {missingSkills.length ? (
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map((s, i) => (
                        <motion.div key={s} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                          <Badge label={s} variant="red" icon="✕" />
                        </motion.div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-600">No critical gaps found. 🎉</p>}
                </div>
              </motion.div>
            )}

            {tab === 2 && (
              <motion.div key="suggestions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }} className="card">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                    <Lightbulb size={15} className="text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">AI Suggestions</h3>
                  <span className="ml-auto text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">{suggestions.length}</span>
                </div>
                <ul className="space-y-3">
                  {suggestions.map((s, i) => (
                    <motion.li key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-3 p-4 rounded-xl transition-all duration-200 cursor-default group"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>{i + 1}</span>
                      <p className="text-sm text-slate-300 leading-relaxed">{s}</p>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {tab === 3 && changes?.hasPrevious && (
              <motion.div key="changes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }} className="space-y-4">

                {/* Score delta banner */}
                <div className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{
                    background: changes.scoreDelta >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${changes.scoreDelta >= 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: changes.scoreDelta >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }}>
                    <GitCompare size={18} style={{ color: changes.scoreDelta >= 0 ? "#10b981" : "#ef4444" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Resume Updated</p>
                    <p className="text-xs text-slate-500 mt-0.5">{changes.summary}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-black tabular-nums"
                      style={{ color: changes.scoreDelta >= 0 ? "#10b981" : "#ef4444" }}>
                      {changes.scoreDelta > 0 ? "+" : ""}{changes.scoreDelta}
                    </p>
                    <p className="text-[9px] text-slate-600">score change</p>
                  </div>
                </div>

                {/* Skills diff */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={14} className="text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">Added Skills</h3>
                      <span className="ml-auto text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {changes.addedSkills?.length || 0}
                      </span>
                    </div>
                    {changes.addedSkills?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {changes.addedSkills.map((s, i) => (
                          <motion.span key={s} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                            style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
                            + {s}
                          </motion.span>
                        ))}
                      </div>
                    ) : <p className="text-xs text-slate-600">No new skills added.</p>}
                  </div>

                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown size={14} className="text-red-400" />
                      <h3 className="text-sm font-bold text-white">Removed Skills</h3>
                      <span className="ml-auto text-xs text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">
                        {changes.removedSkills?.length || 0}
                      </span>
                    </div>
                    {changes.removedSkills?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {changes.removedSkills.map((s, i) => (
                          <motion.span key={s} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                            − {s}
                          </motion.span>
                        ))}
                      </div>
                    ) : <p className="text-xs text-slate-600">No skills removed.</p>}
                  </div>
                </div>

                {/* Improvements & regressions */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {changes.improvements?.length > 0 && (
                    <div className="card">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle size={14} className="text-emerald-400" />
                        <h3 className="text-sm font-bold text-white">Improvements</h3>
                      </div>
                      <ul className="space-y-2">
                        {changes.improvements.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {changes.regressions?.length > 0 && (
                    <div className="card">
                      <div className="flex items-center gap-2 mb-4">
                        <XCircle size={14} className="text-red-400" />
                        <h3 className="text-sm font-bold text-white">Regressions</h3>
                      </div>
                      <ul className="space-y-2">
                        {changes.regressions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp} className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.01, boxShadow: "0 0 40px rgba(99,102,241,0.45)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/interview")}
            className="flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}>
            <Sparkles size={17} /> Start AI Interview Practice
          </motion.button>
          <Button onClick={() => navigate("/upload")} variant="outline" className="py-4 px-5 rounded-2xl font-bold">
            Re-analyze
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
};

export default ResultPage;
