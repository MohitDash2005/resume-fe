import { useRef } from "react";
import { motion } from "framer-motion";

const variants = {
  primary: {
    base: "relative overflow-hidden font-semibold px-5 py-2.5 rounded-xl text-white text-sm",
    style: {
      background: "linear-gradient(135deg, #4f46e5, #6366f1)",
      boxShadow: "0 0 20px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
    },
    hoverStyle: { boxShadow: "0 0 32px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.2)" },
  },
  ghost: {
    base: "font-medium px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm",
    style: {},
    hoverStyle: {},
  },
  danger: {
    base: "font-semibold px-5 py-2.5 rounded-xl text-red-400 text-sm border border-red-500/20 hover:bg-red-500/20",
    style: { background: "rgba(239,68,68,0.08)" },
    hoverStyle: {},
  },
  outline: {
    base: "font-semibold px-5 py-2.5 rounded-xl text-slate-300 text-sm border border-white/10 hover:border-white/20 hover:bg-white/5",
    style: {},
    hoverStyle: {},
  },
};

const Button = ({ children, variant = "primary", className = "", loading = false, icon, ...props }) => {
  const rippleRef = useRef();
  const v = variants[variant] || variants.primary;

  const handleClick = (e) => {
    if (variant !== "primary") { props.onClick?.(e); return; }
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      position:absolute; border-radius:50%; pointer-events:none;
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      background:rgba(255,255,255,0.15);
      transform:scale(0); animation:ripple 0.5s linear;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
    props.onClick?.(e);
  };

  return (
    <motion.button
      whileHover={v.hoverStyle ? { ...v.hoverStyle } : {}}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`${v.base} ${className} flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed`}
      style={v.style}
      {...props}
      onClick={handleClick}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : icon
      }
      {children}
    </motion.button>
  );
};

export default Button;
