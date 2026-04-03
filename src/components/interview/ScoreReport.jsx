import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell, ComposedChart, Line } from "recharts";
import { Download, RotateCcw, ChevronDown, ChevronUp, CheckCircle, XCircle, Lightbulb, Trophy, Clock, Sparkles, Loader2 } from "lucide-react";
import CircularProgress from "../ui/CircularProgress";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { getPerfectAnswer } from "../../api/resumeApi";

const GRADE_COLOR = { A: "#10b981", B: "#6366f1", C: "#f59e0b", D: "#f97316", F: "#ef4444" };
const DIM_LABELS  = ["Relevance","Depth","Keywords","Clarity","Confidence"];

const formatDuration = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ── Collapsible question row ── */
const QuestionRow = ({ item, index, track }) => {
  const [open, setOpen] = useState(false);
  const [perfectAnswer, setPerfectAnswer] = useState(null);
  const [studyNotes, setStudyNotes] = useState([]);
  const [loadingPerfect, setLoadingPerfect] = useState(false);
  const [perfectError, setPerfectError] = useState(false);
  const gc = GRADE_COLOR[item.grade] || "#64748b";

  const handleGeneratePerfect = async () => {
    if (loadingPerfect) return;
    setLoadingPerfect(true);
    setPerfectError(false);
    try {
      const data = await getPerfectAnswer({
        question: item.question,
        track,
        userAnswer: item.answer,
      });
      const answer = typeof data.fullScoreAnswer === "string" && data.fullScoreAnswer.trim()
        ? data.fullScoreAnswer.trim()
        : null;
      if (!answer) throw new Error("empty");
      setPerfectAnswer(answer);
      setStudyNotes(Array.isArray(data.studyNotes) ? data.studyNotes : []);
    } catch (err) {
      console.error("[perfectAnswer] failed:", err?.response?.data || err?.message);
      setPerfectError(true);
    } finally {
      setLoadingPerfect(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
          style={{ background: `${gc}20`, color: gc, border: `1px solid ${gc}30` }}>
          {item.grade}
        </span>
        <p className="flex-1 text-xs text-slate-300 truncate">{item.question}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-black tabular-nums" style={{ color: gc }}>{item.score}</span>
          {open ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="px-4 pb-4 space-y-3 border-t border-white/[0.05]"
          >
            {/* Your answer */}
            <div className="mt-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Your Answer</p>
              <p className="text-xs text-slate-400 leading-relaxed bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                {item.answer || "No answer recorded."}
              </p>
            </div>

            {/* Dimension bars */}
            <div className="grid grid-cols-5 gap-1.5">
              {DIM_LABELS.map((d, i) => {
                const val = Object.values(item.breakdown || {})[i] ?? 0;
                const pct = Math.round((val / 20) * 100);
                const colors = ["#6366f1","#8b5cf6","#10b981","#f59e0b","#ec4899"];
                return (
                  <div key={d} className="text-center">
                    <div className="h-12 flex items-end justify-center mb-1">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.08 }}
                        className="w-3 rounded-t-sm" style={{ background: colors[i], minHeight: 2 }} />
                    </div>
                    <p className="text-[8px] text-slate-600">{d.slice(0,3)}</p>
                    <p className="text-[9px] font-bold" style={{ color: colors[i] }}>{val}</p>
                  </div>
                );
              })}
            </div>

            {/* Feedback tips */}
            {item.feedback?.length > 0 && (
              <div className="space-y-1">
                {item.feedback.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                    <Lightbulb size={10} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    {tip}
                  </div>
                ))}
              </div>
            )}

            {/* Missing keywords */}
            {item.missingKeywords?.length > 0 && (
              <div>
                <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <XCircle size={10} /> Keywords You Missed
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.missingKeywords.map(k => (
                    <span key={k} className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Model answer */}
            {item.modelAnswer && (
              <div>
                <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <CheckCircle size={10} /> Model Answer
                </p>
                <p className="text-xs text-slate-300 leading-relaxed bg-emerald-500/[0.04] rounded-lg p-3 border border-emerald-500/10">
                  {item.modelAnswer}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {!perfectAnswer && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleGeneratePerfect}
                    disabled={loadingPerfect}
                    icon={loadingPerfect ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    className="text-xs py-2 px-3"
                  >
                    {loadingPerfect ? "Generating..." : perfectError ? "Retry Full-Score Answer" : "Generate Full-Score Answer"}
                  </Button>
                  {perfectError && (
                    <p className="text-[11px] text-red-400">Could not generate answer. Please try again.</p>
                  )}
                </>
              )}

              {perfectAnswer && (
                <div>
                  <p className="text-[10px] text-sky-400 font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Sparkles size={10} /> Full-Score Answer
                  </p>
                  <p className="text-xs text-slate-200 leading-relaxed bg-sky-500/[0.05] rounded-lg p-3 border border-sky-500/10">
                    {perfectAnswer}
                  </p>
                </div>
              )}

              {studyNotes.length > 0 && perfectAnswer && (
                <div>
                  <p className="text-[10px] text-violet-300 font-semibold uppercase tracking-wide mb-1.5">
                    Why This Scores Better
                  </p>
                  <div className="space-y-1">
                    {studyNotes.map((note, i) => (
                      <div key={`${note}-${i}`} className="flex items-start gap-2 text-[11px] text-slate-400">
                        <Lightbulb size={10} className="text-violet-300 flex-shrink-0 mt-0.5" />
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ScoreReport = ({ report, onRetry }) => {
  const { overallScore, grade, track, difficulty, duration, answers = [], radarData, weakAreas = [], strengths = [] } = report;
  const gc = GRADE_COLOR[grade] || "#6366f1";

  const handleDownload = () => {
    const lines = [
      `Smart Resume Analyser — Interview Report`,
      `Track: ${track} | Difficulty: ${difficulty}`,
      `Overall Score: ${overallScore}/100 | Grade: ${grade}`,
      `Duration: ${formatDuration(duration)}`,
      ``,
      ...answers.map((a, i) => [
        `Q${i+1}: ${a.question}`,
        `Score: ${a.score}/100 (${a.grade})`,
        `Your Answer: ${a.answer}`,
        `Feedback: ${a.feedback?.join("; ")}`,
        ``
      ].join("\n")),
      `Weak Areas: ${weakAreas.join(", ")}`,
      `Strengths: ${strengths.join(", ")}`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `interview-report-${Date.now()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
  const fadeUp  = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4 pb-4">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" /> Interview Report
          </h3>
          <p className="text-[11px] text-slate-600 mt-0.5">{track} · {difficulty} · {formatDuration(duration)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} icon={<Download size={13} />} className="text-xs py-2 px-3">
            Download
          </Button>
          <Button variant="outline" onClick={onRetry} icon={<RotateCcw size={13} />} className="text-xs py-2 px-3">
            Retry
          </Button>
        </div>
      </motion.div>

      {/* Score hero + radar */}
      <div className="grid sm:grid-cols-5 gap-4">
        <motion.div variants={fadeUp} className="card sm:col-span-2 flex flex-col items-center justify-center py-6 gap-3">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Overall Score</p>
          <CircularProgress score={overallScore} size={140} />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black" style={{ color: gc }}>{grade}</span>
            <div className="text-left">
              <p className="text-xs font-bold text-white">{grade === "A" ? "Excellent" : grade === "B" ? "Good" : grade === "C" ? "Average" : "Needs Work"}</p>
              <p className="text-[10px] text-slate-600">{answers.length} questions answered</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="card sm:col-span-3">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-2">Performance Radar</p>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 9, fontWeight: 600 }} />
              <Tooltip contentStyle={{ background: "rgba(12,12,22,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 11 }} />
              <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.12} strokeWidth={2}
                dot={{ fill: "#818cf8", r: 3, strokeWidth: 0 }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Strengths + Weak areas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="card">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-emerald-400" />
            <h4 className="text-xs font-bold text-white">Strengths</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {strengths.length ? strengths.map(s => <Badge key={s} label={s} variant="green" icon="✓" />)
              : <p className="text-[11px] text-slate-600">Keep practicing to build strengths.</p>}
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="card">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={14} className="text-red-400" />
            <h4 className="text-xs font-bold text-white">Areas to Improve</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {weakAreas.length ? weakAreas.map(s => <Badge key={s} label={s} variant="red" icon="↑" />)
              : overallScore >= 85
                ? <p className="text-[11px] text-slate-600">Excellent performance — no weak areas!</p>
                : <p className="text-[11px] text-slate-600">Check the question breakdown below for specific feedback on each answer.</p>}
          </div>
        </motion.div>
      </div>

      {/* Confidence per question chart */}
      <motion.div variants={fadeUp} className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(236,72,153,0.15)" }}>
            <span className="text-sm">🎯</span>
          </div>
          <h4 className="text-xs font-bold text-white">Confidence Per Question</h4>
          <span className="ml-auto text-[10px] text-slate-600">Voice + Face</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={answers.map((a, i) => ({
            name: `Q${i + 1}`,
            voice: a.breakdown?.confidence ?? 0,
            face:  Math.round((a.faceConfidence ?? 0) / 5),  // scale 0-100 → 0-20
            total: Math.round(((a.breakdown?.confidence ?? 0) + Math.round((a.faceConfidence ?? 0) / 5)) / 2),
          }))} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 20]} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "rgba(6,6,16,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 11 }}
              formatter={(val, name) => [
                `${val}/20`,
                name === "voice" ? "Voice Confidence" : name === "face" ? "Face Confidence" : "Combined"
              ]}
            />
            <Bar dataKey="voice" fill="#6366f1" radius={[3,3,0,0]} maxBarSize={24} opacity={0.85} />
            <Bar dataKey="face"  fill="#ec4899" radius={[3,3,0,0]} maxBarSize={24} opacity={0.85} />
            <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center">
          {[["#6366f1","Voice"], ["#ec4899","Face"], ["#10b981","Combined"]].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Per-question breakdown */}
      <motion.div variants={fadeUp} className="card">
        <h4 className="text-xs font-bold text-white mb-3">Question-by-Question Breakdown</h4>
        <div className="space-y-2">
          {answers.map((item, i) => <QuestionRow key={i} item={item} index={i} track={track} />)}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ScoreReport;
