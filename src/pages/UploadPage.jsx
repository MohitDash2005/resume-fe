import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle, AlertCircle, Sparkles, Zap, Shield, BarChart2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { uploadResume } from "../api/resumeApi";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";

const ACCEPTED = ["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const formatSize = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

/* ── Confetti ── */
const Confetti = () => {
  const pieces = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ["#6366f1","#8b5cf6","#10b981","#f59e0b","#06b6d4","#818cf8"][i % 6],
    delay: Math.random() * 0.5,
    duration: 0.9 + Math.random() * 0.7,
    rotate: Math.random() * 360,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ x: `${p.x}%`, y: "50%", opacity: 1, scale: 0, rotate: 0 }}
          animate={{ y: "-20%", opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          className="absolute w-2 h-2 rounded-sm"
          style={{ background: p.color, left: 0, top: 0 }} />
      ))}
    </div>
  );
};

/* ── Scan line ── */
const ScanLine = () => (
  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
    <motion.div
      animate={{ y: ["0%", "100%", "0%"] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      className="absolute left-0 right-0 h-px opacity-50"
      style={{ background: "linear-gradient(90deg, transparent, #6366f1, #818cf8, #6366f1, transparent)" }} />
    <div className="absolute inset-0 opacity-[0.03]"
      style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
  </div>
);

const STEPS_NAV = [
  { icon: Upload,    label: "Upload",  sub: "Select file" },
  { icon: Zap,       label: "Analyze", sub: "AI processing" },
  { icon: BarChart2, label: "Results", sub: "View insights" },
];

const ANALYSIS_STEPS = [
  { label: "Parsing document structure",   icon: "📄" },
  { label: "Extracting skills & keywords", icon: "🔍" },
  { label: "Running ATS compatibility",    icon: "⚙️" },
  { label: "Scoring & generating report",  icon: "📊" },
];

const TIPS = [
  "Use a clean, single-column format for better ATS parsing",
  "Include quantifiable achievements (e.g. 'Increased sales by 30%')",
  "List skills explicitly — avoid embedding them in paragraphs",
];

const UploadPage = () => {
  const [file, setFile]           = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [progress, setProgress]   = useState(0);
  const [status, setStatus]       = useState("idle");
  const [error, setError]         = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef();
  const { setResult } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const currentStep = status === "idle" ? 0 : status === "uploading" ? 1 : 2;

  const validate = (f) => {
    if (!ACCEPTED.includes(f.type)) { setError("Only PDF or DOCX files are supported."); return false; }
    if (f.size > 5 * 1024 * 1024)  { setError("File must be under 5 MB."); return false; }
    setError(""); return true;
  };

  const handleFile = useCallback((f) => {
    if (f && validate(f)) { setFile(f); setStatus("idle"); }
  }, []);

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = async () => {
    if (!file) return;
    setStatus("uploading"); setProgress(0); setAnalysisStep(0);

    const stepInterval = setInterval(() => {
      setAnalysisStep(s => s < ANALYSIS_STEPS.length - 1 ? s + 1 : s);
    }, 700);

    const progressInterval = setInterval(() => {
      setProgress(p => { if (p >= 88) { clearInterval(progressInterval); return p; } return p + 7; });
    }, 200);

    try {
      const result = await uploadResume(file);
      clearInterval(stepInterval); clearInterval(progressInterval);
      setProgress(100); setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setStatus("success"); setShowConfetti(true);
      setResult(result);
      if (result.changes?.hasPrevious) {
        toast.success("Resume Updated!", `Score changed by ${result.changes.scoreDelta >= 0 ? "+" : ""}${result.changes.scoreDelta} pts. See Changes tab for details.`);
      } else {
        toast.success("Analysis Complete!", `Your resume scored ${result.score}/100`);
      }
      setTimeout(() => navigate("/results"), 1200);
    } catch {
      clearInterval(stepInterval); clearInterval(progressInterval);
      setStatus("error"); setError("Analysis failed. Please check your file and try again.");
      toast.error("Upload Failed", "Could not analyze your resume.");
    }
  };

  const reset = () => { setFile(null); setStatus("idle"); setError(""); setProgress(0); setShowConfetti(false); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16,1,.3,1] }}
      className="max-w-2xl mx-auto space-y-5 pb-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white">Upload Resume</h2>
        <p className="text-slate-600 text-sm mt-1">AI-powered analysis · ATS scoring · Skill gap detection</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center">
        {STEPS_NAV.map(({ icon: Icon, label, sub }, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <motion.div
                animate={i <= currentStep ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                style={i < currentStep
                  ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }
                  : i === currentStep
                    ? { background: "linear-gradient(135deg,rgba(79,70,229,0.25),rgba(99,102,241,0.15))", border: "1px solid rgba(99,102,241,0.4)", boxShadow: "0 0 20px rgba(99,102,241,0.2)" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {i < currentStep
                  ? <CheckCircle size={17} className="text-emerald-400" />
                  : <Icon size={17} className={i === currentStep ? "text-primary-400" : "text-slate-600"} />
                }
              </motion.div>
              <div className="text-center">
                <p className={`text-[11px] font-bold ${i <= currentStep ? "text-white" : "text-slate-600"}`}>{label}</p>
                <p className="text-[9px] text-slate-700">{sub}</p>
              </div>
            </div>
            {i < STEPS_NAV.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-5 transition-all duration-500"
                style={{ background: i < currentStep ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.06)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !file && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden"
        style={dragging
          ? { borderColor: "#6366f1", background: "rgba(99,102,241,0.08)", boxShadow: "0 0 40px rgba(99,102,241,0.18)", cursor: "copy" }
          : file
            ? { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", cursor: "default" }
            : { borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", cursor: "pointer" }
        }
        onMouseEnter={e => { if (!file) e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
        onMouseLeave={e => { if (!file) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />

        {status === "uploading" && <ScanLine />}
        {showConfetti && <Confetti />}

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <motion.div
                animate={dragging ? { scale: 1.2, rotate: [0, -5, 5, 0] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-18 h-18 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300"
                style={dragging
                  ? { background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 0 40px rgba(99,102,241,0.5)", width: 72, height: 72 }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", width: 72, height: 72 }}>
                <Upload size={28} className={dragging ? "text-white" : "text-slate-500"} />
              </motion.div>
              <p className="text-white font-bold text-lg mb-1">
                {dragging ? "Release to upload" : "Drop your resume here"}
              </p>
              <p className="text-slate-600 text-sm mb-6">
                or <span className="text-primary-400 hover:text-primary-300 transition-colors">browse files</span>
              </p>
              <div className="flex items-center gap-3">
                {[["PDF", "📄"], ["DOCX", "📝"]].map(([t, e]) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-slate-600 px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {e} {t}
                  </span>
                ))}
                <span className="text-xs text-slate-700">Max 5 MB</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <FileText size={22} className="text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{file.name}</p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {formatSize(file.size)} · {file.type.includes("pdf") ? "PDF Document" : "Word Document"}
                  </p>
                </div>
                {status === "idle" && (
                  <button onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/10 transition-all">
                    <X size={15} />
                  </button>
                )}
                {status === "success" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                    <CheckCircle size={22} className="text-emerald-400 flex-shrink-0" style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.7))" }} />
                  </motion.div>
                )}
                {status === "error" && <AlertCircle size={22} className="text-red-400 flex-shrink-0" />}
              </div>

              {(status === "uploading" || status === "success") && (
                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">{status === "success" ? "✅ Analysis complete!" : "Analyzing resume..."}</span>
                    <span className="font-bold tabular-nums" style={{ color: status === "success" ? "#10b981" : "#818cf8" }}>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.25 }}
                      className="h-full rounded-full"
                      style={{
                        background: status === "success"
                          ? "linear-gradient(90deg,#10b981,#34d399)"
                          : "linear-gradient(90deg,#4f46e5,#818cf8)",
                        boxShadow: status === "success" ? "0 0 10px rgba(16,185,129,0.6)" : "0 0 10px rgba(99,102,241,0.6)",
                      }} />
                  </div>
                  {status === "uploading" && (
                    <div className="mt-4 space-y-2">
                      {ANALYSIS_STEPS.map((step, i) => (
                        <motion.div key={step.label}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: i <= analysisStep ? 1 : 0.3, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-2.5">
                          <span className="text-sm">{step.icon}</span>
                          <span className={`text-xs transition-colors duration-300 ${i <= analysisStep ? "text-slate-300" : "text-slate-700"}`}>
                            {step.label}
                          </span>
                          {i < analysisStep && <CheckCircle size={11} className="text-emerald-400 ml-auto" />}
                          {i === analysisStep && (
                            <span className="ml-auto w-3 h-3 border-2 border-primary-500/30 border-t-primary-400 rounded-full animate-spin" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature pills */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Shield,    label: "ATS Optimized",    color: "#6366f1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.15)" },
          { icon: Zap,       label: "Instant Analysis", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.15)" },
          { icon: BarChart2, label: "Skill Insights",   color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.15)" },
        ].map(({ icon: Icon, label, color, bg, border }) => (
          <motion.div key={label} whileHover={{ y: -2 }}
            className="flex flex-col items-center gap-2 p-3.5 rounded-xl text-center"
            style={{ background: bg, border: `1px solid ${border}` }}>
            <Icon size={17} style={{ color }} />
            <p className="text-[11px] text-slate-400 font-semibold">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tips */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-primary-400" />
          <h3 className="text-sm font-bold text-white">Tips for best results</h3>
        </div>
        <ul className="space-y-2.5">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-500">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>{i + 1}</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <motion.button
        onClick={handleSubmit}
        disabled={!file || status === "uploading" || status === "success"}
        whileHover={file && status === "idle" ? { scale: 1.01, boxShadow: "0 0 48px rgba(99,102,241,0.5)" } : {}}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg,#4f46e5,#6366f1,#818cf8)",
          boxShadow: "0 0 32px rgba(99,102,241,0.35)",
        }}>
        {status === "uploading"
          ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing Resume...</>
          : status === "success"
            ? <><CheckCircle size={18} /> Redirecting to Results...</>
            : <><Sparkles size={18} /> Analyze My Resume <ArrowRight size={16} /></>
        }
      </motion.button>
    </motion.div>
  );
};

export default UploadPage;
