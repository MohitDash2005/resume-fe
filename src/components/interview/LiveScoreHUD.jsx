import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const DIM_LABELS = {
  relevance:  { label: "Relevance",  color: "#6366f1" },
  depth:      { label: "Depth",      color: "#8b5cf6" },
  keywords:   { label: "Keywords",   color: "#10b981" },
  clarity:    { label: "Clarity",    color: "#f59e0b" },
  confidence: { label: "Confidence", color: "#ec4899" },
};

const formatDuration = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const LiveScoreHUD = ({ currentScore, breakdown, qTimer, qIndex, totalQ, sessionScore, visible, sessionRemaining, responseTimeout, responseElapsed }) => {
  const [expanded, setExpanded] = useState(true);

  if (!visible) return null;

  const scoreColor  = currentScore >= 70 ? "#10b981" : currentScore >= 45 ? "#f59e0b" : "#ef4444";
  const timerColor  = qTimer <= 10 ? "#ef4444" : qTimer <= 20 ? "#f59e0b" : "#64748b";

  // Session countdown colours
  const sessionColor = sessionRemaining <= 60 ? "#ef4444" : sessionRemaining <= 180 ? "#f59e0b" : "#10b981";
  const sessionPct   = sessionRemaining != null && responseTimeout
    ? Math.max(0, (sessionRemaining / (sessionRemaining + 1)) * 100) // just for display pulse
    : 100;

  // Response timeout bar
  const responsePct  = responseTimeout ? Math.max(0, 100 - (responseElapsed / responseTimeout) * 100) : 100;
  const responseColor = responsePct <= 25 ? "#ef4444" : responsePct <= 50 ? "#f59e0b" : "#6366f1";

  const fmtSec = (s) => s >= 60 ? `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}` : `${s}s`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(8,8,16,0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BarChart2 size={12} className="text-primary-400" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">Live Score</span>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-slate-600 hover:text-white transition-colors">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="px-3 py-2.5 space-y-2.5"
          >
            {/* Session countdown */}
            {sessionRemaining != null && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Session Left</span>
                <motion.span key={sessionRemaining}
                  animate={sessionRemaining <= 60 ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="text-xs font-black tabular-nums"
                  style={{ color: sessionColor }}>
                  {fmtSec(sessionRemaining)}
                </motion.span>
              </div>
            )}

            {/* Response timeout bar */}
            {responseTimeout > 0 && (
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-slate-600">Response Time</span>
                  <span className="font-bold" style={{ color: responseColor }}>
                    {Math.max(0, responseTimeout - (responseElapsed || 0))}s left
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    animate={{ width: `${responsePct}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                    className="h-full rounded-full"
                    style={{ background: responseColor, boxShadow: `0 0 6px ${responseColor}80` }}
                  />
                </div>
              </div>
            )}

            {/* Current answer score */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">This Answer</span>
              <motion.span key={currentScore}
                initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-base font-black tabular-nums"
                style={{ color: scoreColor }}>
                {currentScore ?? "--"}
              </motion.span>
            </div>

            {/* Dimension bars */}
            {breakdown && Object.entries(DIM_LABELS).map(([key, { label, color }]) => {
              const val = breakdown[key] ?? 0;
              const max = 20;
              const pct = Math.round((val / max) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-bold" style={{ color }}>{val}/{max}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.16,1,.3,1] }}
                      className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}80` }} />
                  </div>
                </div>
              );
            })}

            {/* Divider */}
            <div className="h-px bg-white/[0.05]" />

            {/* Session avg + timer */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-600">Session Avg</p>
                <p className="text-xs font-black text-white tabular-nums">{sessionScore ?? "--"}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-600">Q Time</p>
                <p className="text-xs font-black tabular-nums" style={{ color: timerColor }}>
                  {formatDuration(qTimer ?? 0)}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex gap-1">
              {Array.from({ length: totalQ }).map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    background: i < qIndex ? "#10b981"
                      : i === qIndex ? "#6366f1"
                      : "rgba(255,255,255,0.06)"
                  }} />
              ))}
            </div>
            <p className="text-[9px] text-slate-600 text-center">Q{qIndex + 1} of {totalQ}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LiveScoreHUD;
