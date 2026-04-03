import { motion, AnimatePresence } from "framer-motion";
import { Mic, Type, Loader2 } from "lucide-react";

const SubtitleBar = ({ transcript, interim, listening, ttsActive, aiText, processing }) => {
  const hasContent = transcript || interim || processing || (ttsActive && aiText);
  if (!hasContent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl px-4 py-2.5 flex items-start gap-2.5"
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {ttsActive
            ? <Type size={12} className="text-primary-400" />
            : processing
              ? <Loader2 size={12} className="text-amber-400 animate-spin" />
              : <Mic size={12} className={listening ? "text-emerald-400" : "text-slate-600"} />
          }
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {processing ? (
            <p className="text-xs text-slate-300 leading-relaxed">
              <span className="text-amber-400 font-semibold text-[10px] mr-1.5">Status:</span>
              Answer captured. Scoring your response and preparing the next question...
            </p>
          ) : ttsActive && aiText ? (
            <p className="text-xs text-slate-300 leading-relaxed">
              <span className="text-primary-400 font-semibold text-[10px] mr-1.5">AI:</span>
              {aiText}
            </p>
          ) : (
            <p className="text-xs text-slate-300 leading-relaxed">
              {transcript && (
                <span className="text-white">{transcript} </span>
              )}
              {interim && (
                <span className="text-slate-500 italic">{interim}</span>
              )}
              {!transcript && !interim && listening && (
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-slate-600 text-[10px]">
                  Listening for your answer...
                </motion.span>
              )}
            </p>
          )}
        </div>

        {/* Live indicator */}
        {(listening || ttsActive || processing) && (
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
            style={{ background: processing ? "#f59e0b" : ttsActive ? "#6366f1" : "#10b981" }} />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SubtitleBar;


