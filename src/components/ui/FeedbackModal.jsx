import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Send, Check } from "lucide-react";
import { submitFeedback } from "../../api/resumeApi";
import { useToast } from "./Toast";

const CATEGORIES = [
  { value: "general",   label: "General" },
  { value: "resume",    label: "Resume Analysis" },
  { value: "interview", label: "Interview" },
  { value: "ui",        label: "UI / Design" },
  { value: "other",     label: "Other" },
];

const FeedbackModal = ({ onClose }) => {
  const [rating,   setRating]   = useState(0);
  const [hovered,  setHovered]  = useState(0);
  const [category, setCategory] = useState("general");
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");
  const toast = useToast();

  const handleSubmit = async () => {
    if (!rating)          { setError("Please select a rating"); return; }
    if (!message.trim())  { setError("Please write a message"); return; }
    setLoading(true); setError("");
    try {
      await submitFeedback({ rating, category, message });
      setDone(true);
      toast.success("Feedback sent!", "Thank you for your feedback.");
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to submit feedback");
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 16 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "rgba(6,6,16,0.99)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-bold text-white">Share Feedback</h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={14} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <Check size={26} className="text-emerald-400" />
              </div>
              <p className="text-white font-bold text-sm">Thank you!</p>
              <p className="text-slate-500 text-xs">Your feedback has been submitted.</p>
            </motion.div>
          ) : (
            <motion.div key="form" className="px-6 py-5 space-y-5">
              {/* Stars */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <motion.button key={n}
                      whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}>
                      <Star
                        size={28}
                        fill={(hovered || rating) >= n ? "#f59e0b" : "transparent"}
                        className="transition-colors duration-150"
                        style={{ color: (hovered || rating) >= n ? "#f59e0b" : "rgba(255,255,255,0.15)" }}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setCategory(c.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={category === c.value
                        ? { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b" }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Message</p>
                <textarea
                  value={message}
                  onChange={e => { setMessage(e.target.value); setError(""); }}
                  placeholder="Tell us what you think..."
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
                <p className="text-[10px] text-slate-700 text-right">{message.length}/1000</p>
              </div>

              {error && (
                <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}>
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Send size={14} /> Submit Feedback</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackModal;
