import { useEffect, useState, useRef } from "react";

const getColor = (score) => {
  if (score >= 75) return { stroke: ["#10b981","#34d399"], text: "text-emerald-400", label: "Excellent",  glow: "rgba(16,185,129,0.4)" };
  if (score >= 50) return { stroke: ["#f59e0b","#fbbf24"], text: "text-amber-400",   label: "Good",       glow: "rgba(245,158,11,0.4)" };
  return              { stroke: ["#ef4444","#f87171"], text: "text-red-400",     label: "Needs Work", glow: "rgba(239,68,68,0.4)" };
};

const useCountUp = (target, duration = 1400, delay = 150) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    let raf;
    const timeout = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        setVal(Math.round(ease * target));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return val;
};

const CircularProgress = ({ score, size = 160 }) => {
  const displayed = useCountUp(score);
  const { stroke, text, label, glow } = getColor(score);
  const cx = size / 2, cy = size / 2;
  const rOuter = cx - 12, rInner = cx - 20;
  const circOuter = 2 * Math.PI * rOuter;
  const circInner = 2 * Math.PI * rInner;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const offsetOuter = circOuter - (mounted ? (score / 100) * circOuter : circOuter);
  const offsetInner = circInner - (mounted ? ((score * 0.85) / 100) * circInner : circInner);

  const gradId = `grad-${score}`;
  const glowId = `glow-${score}`;

  return (
    <div className="relative flex flex-col items-center gap-3">
      <div style={{ filter: `drop-shadow(0 0 20px ${glow})` }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={stroke[0]} />
              <stop offset="100%" stopColor={stroke[1]} />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Track rings */}
          <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="9" />
          <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="5" />

          {/* Inner ring (secondary) */}
          <circle cx={cx} cy={cy} r={rInner} fill="none" strokeWidth="5"
            stroke={stroke[1]} strokeOpacity="0.4" strokeLinecap="round"
            strokeDasharray={circInner} strokeDashoffset={offsetInner}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)" }}
          />

          {/* Outer ring (main) */}
          <circle cx={cx} cy={cy} r={rOuter} fill="none" strokeWidth="9"
            stroke={`url(#${gradId})`} strokeLinecap="round"
            strokeDasharray={circOuter} strokeDashoffset={offsetOuter}
            filter={`url(#${glowId})`}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)" }}
          />

          {/* End dot */}
          {mounted && (
            <circle
              cx={cx + rOuter * Math.cos((2 * Math.PI * score / 100) - Math.PI / 2)}
              cy={cy + rOuter * Math.sin((2 * Math.PI * score / 100) - Math.PI / 2)}
              r="5" fill={stroke[0]}
              style={{ filter: `drop-shadow(0 0 4px ${stroke[0]})`, transform: "rotate(90deg)", transformOrigin: `${cx}px ${cy}px` }}
            />
          )}
        </svg>
      </div>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={`font-black ${text} tabular-nums`} style={{ fontSize: size * 0.22 }}>{displayed}</span>
        <span className="text-slate-600 font-medium" style={{ fontSize: size * 0.075 }}>/ 100</span>
      </div>

      {/* Label */}
      <span className={`text-xs font-bold tracking-wide uppercase ${text}`}>{label}</span>
    </div>
  );
};

export default CircularProgress;
