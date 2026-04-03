import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";

const STATES = {
  idle:      { label: "AI Interviewer",  color: "#6366f1", glow: "rgba(99,102,241,0.3)",  pulse: false },
  speaking:  { label: "AI is speaking…", color: "#10b981", glow: "rgba(16,185,129,0.4)",  pulse: true  },
  thinking:  { label: "AI is thinking…", color: "#f59e0b", glow: "rgba(245,158,11,0.35)", pulse: true  },
  listening: { label: "AI is listening…",color: "#818cf8", glow: "rgba(129,140,248,0.4)", pulse: true  },
};

/* Animated sound bars for speaking state */
const SoundBars = ({ active, color }) => (
  <div className="flex items-end gap-0.5 h-5">
    {[0.4, 0.9, 0.6, 1, 0.7, 0.5, 0.8].map((h, i) => (
      <motion.div key={i}
        className="w-0.5 rounded-full"
        style={{ background: color }}
        animate={active ? { scaleY: [h * 0.3, h, h * 0.3] } : { scaleY: 0.2 }}
        transition={active ? { duration: 0.5 + i * 0.05, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 } : {}}
      />
    ))}
  </div>
);

/* Thinking dots */
const ThinkingDots = ({ color }) => (
  <div className="flex gap-1">
    {[0, 1, 2].map(i => (
      <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
    ))}
  </div>
);

const AIAvatar = ({ state = "idle", track = "General", size = "md" }) => {
  const meta   = STATES[state] || STATES.idle;
  const isLg   = size === "lg";
  const dim    = isLg ? 80 : 48;
  const iconSz = isLg ? 32 : 20;

  return (
    <div className={`flex flex-col items-center gap-${isLg ? 3 : 2}`}>
      {/* Avatar ring */}
      <div className="relative">
        {/* Outer pulse ring */}
        {meta.pulse && (
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl"
            style={{ background: meta.glow, borderRadius: isLg ? 20 : 14 }}
          />
        )}

        {/* Main avatar */}
        <motion.div
          animate={meta.pulse ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative flex items-center justify-center rounded-2xl overflow-hidden"
          style={{
            width: dim, height: dim,
            background: `linear-gradient(135deg, rgba(79,70,229,0.25), rgba(124,58,237,0.15))`,
            border: `2px solid ${meta.color}40`,
            boxShadow: `0 0 ${isLg ? 28 : 16}px ${meta.glow}`,
          }}
        >
          {/* Animated gradient background */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-20"
            style={{ background: `conic-gradient(${meta.color}, transparent, ${meta.color})` }}
          />
          <Bot size={iconSz} className="relative z-10" style={{ color: meta.color }} />
        </motion.div>

        {/* Status dot */}
        <motion.div
          animate={meta.pulse ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080810]"
          style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
        />
      </div>

      {/* Label + indicator */}
      <div className="flex flex-col items-center gap-1">
        <AnimatePresence mode="wait">
          <motion.p key={state}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className={`font-semibold ${isLg ? "text-xs" : "text-[10px]"}`}
            style={{ color: meta.color }}>
            {meta.label}
          </motion.p>
        </AnimatePresence>

        {state === "speaking"  && <SoundBars active color={meta.color} />}
        {state === "thinking"  && <ThinkingDots color={meta.color} />}
        {state === "listening" && (
          <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}
            className="text-[9px] text-slate-500">recording…</motion.p>
        )}
      </div>
    </div>
  );
};

export default AIAvatar;
