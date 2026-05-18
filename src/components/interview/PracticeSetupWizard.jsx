import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Building2, BarChart2, Globe, Zap, Users } from "lucide-react";
import { COMPANIES, PRACTICE_QUESTIONS } from "../../data/practiceQuestions";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const DIFF_META = {
  Beginner:     { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", desc: "Foundational concepts" },
  Intermediate: { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   desc: "Real-world scenarios" },
  Advanced:     { color: "text-red-400",      bg: "bg-red-500/10",     border: "border-red-500/20",     desc: "Expert-level depth" },
};

const FEATURES = [
  { icon: Globe,     label: "Speech-to-Text", sub: "Answer by voice" },
  { icon: BarChart2, label: "Live Scoring",   sub: "Real-time feedback" },
  { icon: Zap,       label: "AI Follow-ups",  sub: "Dynamic questions" },
  { icon: Users,     label: "Face Detection", sub: "Eye contact meter" },
];

const slideVariants = {
  enter:  { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit:   { opacity: 0, x: -30 },
};

const PracticeSetupWizard = ({ onStart }) => {
  const [step, setStep]             = useState(0);
  const [company, setCompany]       = useState(null);
  const [difficulty, setDifficulty] = useState("");
  const [qCount, setQCount]         = useState(5);
  const [useVideo, setUseVideo]     = useState(true);
  const [useVoice, setUseVoice]     = useState(true);
  const [showFeedback, setShowFeedback] = useState(true);
  const [sessionMinutes, setSessionMinutes] = useState(15);
  const [responseTimeout, setResponseTimeout] = useState(60);
  const availableQuestions = PRACTICE_QUESTIONS[company?.id]?.[difficulty]?.length || 5;
  const maxQuestions = Math.max(3, availableQuestions);

  const canNext = step === 0 ? !!company : step === 1 ? !!difficulty : true;

  const next = () => {
    if (step < 2) { setStep(s => s + 1); return; }
    // Build question pool from static data, pass as context
    const pool = PRACTICE_QUESTIONS[company.id]?.[difficulty] || [];
    onStart({
      track: company.name,
      difficulty,
        qCount: Math.min(qCount, pool.length || qCount),
      useVideo,
      useVoice,
      showFeedback,
      sessionMinutes,
      responseTimeout,
      resumeContext: null,
      // company-specific: first question seeded from pool, rest AI-adaptive with company context
      companyId: company.id,
      companyName: company.name,
      companyRole: company.role,
      questionPool: pool,
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-2">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="relative inline-block mb-4">
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.2)", boxShadow: "0 0 28px rgba(236,72,153,0.15)" }}>
            <Building2 size={28} className="text-pink-400" />
          </motion.div>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 pointer-events-none">
            <div className="w-2 h-2 rounded-full absolute -top-1 left-1/2 -translate-x-1/2"
              style={{ background: "#ec4899", boxShadow: "0 0 6px #ec4899" }} />
          </motion.div>
        </div>
        <h3 className="text-lg font-black text-white">Premium Interview Setup</h3>
        <p className="text-slate-500 text-xs mt-1">Company-specific interviews with the full live interview flow</p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {["Company", "Difficulty", "Options"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-300
              ${i <= step ? "text-white" : "text-slate-600"}`}
              style={i <= step
                ? { background: "rgba(236,72,153,0.2)", border: "1px solid rgba(236,72,153,0.3)" }
                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black
                ${i < step ? "bg-emerald-500" : i === step ? "bg-pink-500" : "bg-white/10"}`}>
                {i < step ? "✓" : i + 1}
              </span>
              {s}
            </div>
            {i < 2 && <div className="w-4 h-px" style={{ background: i < step ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.08)" }} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">

          {/* Step 0 — Company grid */}
          {step === 0 && (
            <motion.div key="company" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25 }} className="space-y-3">
              <p className="text-xs text-slate-500 text-center mb-3">Choose a company to practice for</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                {COMPANIES.map(c => {
                  const qCount = Object.values(PRACTICE_QUESTIONS[c.id] || {}).flat().length;
                  const isSelected = company?.id === c.id;
                  return (
                    <motion.button key={c.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setCompany(c)}
                      className={`relative p-3.5 rounded-xl text-left transition-all duration-200 bg-gradient-to-br ${c.color}
                        ${isSelected ? `border-2 ${c.border}` : "border border-white/[0.07] hover:border-white/15"}`}
                      style={isSelected ? { boxShadow: "0 0 16px rgba(236,72,153,0.2)" } : {}}
                    >
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                          <span className="text-[8px] text-white font-black">✓</span>
                        </motion.div>
                      )}
                      <span className="text-xl mb-1.5 block">{c.icon}</span>
                      <p className="text-xs font-bold text-white">{c.name}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{c.role}</p>
                      <p className="text-[9px] text-pink-400/70 mt-1">{qCount} questions</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 1 — Difficulty */}
          {step === 1 && (
            <motion.div key="diff" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25 }} className="space-y-2.5">
              <p className="text-xs text-slate-500 text-center mb-3">Select difficulty level</p>
              {DIFFICULTIES.map(d => {
                const meta = DIFF_META[d];
                const pool = PRACTICE_QUESTIONS[company?.id]?.[d] || [];
                return (
                  <motion.button key={d} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setDifficulty(d)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200
                      ${difficulty === d ? `${meta.bg} border ${meta.border}` : "border border-white/[0.07] hover:border-white/12"}`}
                    style={{ background: difficulty === d ? undefined : "rgba(255,255,255,0.02)" }}
                  >
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-lg font-black ${meta.color}`}>{d[0]}</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className={`text-sm font-bold ${difficulty === d ? "text-white" : "text-slate-300"}`}>{d}</p>
                      <p className="text-[11px] text-slate-500">{meta.desc} · {pool.length} questions available</p>
                    </div>
                    {difficulty === d && <span className="text-pink-400 text-sm">✓</span>}
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {/* Step 2 — Options */}
          {step === 2 && (
            <motion.div key="opts" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25 }} className="space-y-4">
              <p className="text-xs text-slate-500 text-center mb-3">Configure session options</p>

              {/* Company context preview */}
              <div className="p-3 rounded-xl flex items-center gap-3"
                style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)" }}>
                <span className="text-2xl">{company?.icon}</span>
                <div>
                  <p className="text-xs font-bold text-pink-300">{company?.name} · {difficulty}</p>
                  <p className="text-[10px] text-slate-500">{company?.role}</p>
                </div>
              </div>

              {/* Question count */}
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-white">Number of Questions</p>
                  <span className="text-pink-400 font-black text-sm">{qCount}</span>
                </div>
                <input type="range" min={3} max={maxQuestions} value={Math.min(qCount, maxQuestions)} onChange={e => setQCount(+e.target.value)}
                  className="w-full cursor-pointer" style={{ accentColor: "#ec4899" }} />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>3 (Quick)</span><span>{maxQuestions} (Available)</span>
                </div>
              </div>

              {/* Session duration */}
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Session Duration</p>
                    <p className="text-[10px] text-slate-600">Interview ends when time runs out</p>
                  </div>
                  <span className="text-amber-400 font-black text-sm">{sessionMinutes} min</span>
                </div>
                <input type="range" min={5} max={60} step={5} value={sessionMinutes} onChange={e => setSessionMinutes(+e.target.value)}
                  className="w-full cursor-pointer" style={{ accentColor: "#f59e0b" }} />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>5 min</span><span>60 min</span>
                </div>
              </div>

              {/* Response timeout */}
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Response Timeout</p>
                    <p className="text-[10px] text-slate-600">Auto-end if no answer within this time</p>
                  </div>
                  <span className="text-red-400 font-black text-sm">{responseTimeout}s</span>
                </div>
                <input type="range" min={30} max={120} step={10} value={responseTimeout} onChange={e => setResponseTimeout(+e.target.value)}
                  className="w-full cursor-pointer" style={{ accentColor: "#ef4444" }} />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>30s</span><span>120s</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                {[
                  { label: "Enable Webcam",       sub: "Face & eye contact detection", val: useVideo,     set: setUseVideo },
                  { label: "Voice Mode (STT/TTS)", sub: "Speak your answers",           val: useVoice,     set: setUseVoice },
                  { label: "Live Answer Feedback", sub: "See score after each answer",  val: showFeedback, set: setShowFeedback },
                ].map(({ label, sub, val, set }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div>
                      <p className="text-xs font-semibold text-white">{label}</p>
                      <p className="text-[10px] text-slate-600">{sub}</p>
                    </div>
                    <button onClick={() => set(v => !v)}
                      className={`w-10 h-5 rounded-full transition-all duration-300 relative flex-shrink-0 ${val ? "bg-pink-600" : "bg-white/10"}`}
                      style={val ? { boxShadow: "0 0 10px rgba(236,72,153,0.4)" } : {}}>
                      <motion.div animate={{ x: val ? 20 : 2 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge label={company?.name} variant="slate" icon={company?.icon} />
                <Badge label={difficulty} variant={difficulty === "Advanced" ? "red" : difficulty === "Intermediate" ? "amber" : "green"} />
                <Badge label={`${qCount} Questions`} variant="slate" />
                <Badge label={`${sessionMinutes}m session`} variant="amber" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 text-sm">
            Back
          </Button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          disabled={!canNext}
          className="px-8 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{ background: "linear-gradient(135deg,#db2777,#ec4899)", boxShadow: "0 0 20px rgba(236,72,153,0.3)" }}
        >
          {step === 2 ? <><Zap size={15} /> Start Premium Interview</> : <><ChevronRight size={15} /> Continue</>}
        </motion.button>
      </div>

      {/* Feature pills */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
        {FEATURES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Icon size={13} className="text-pink-400" />
            <p className="text-[9px] text-slate-500 leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeSetupWizard;
