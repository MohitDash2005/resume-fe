import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  error:   { icon: XCircle,     color: "text-red-400",     bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
  warning: { icon: AlertTriangle,color: "text-amber-400",  bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  info:    { icon: Info,         color: "text-primary-400", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)" },
};

const Toast = ({ id, type = "info", title, message, onRemove }) => {
  const { icon: Icon, color, bg, border } = ICONS[type] || ICONS.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 80, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="flex items-start gap-3 w-80 rounded-2xl px-4 py-3.5 shadow-2xl"
      style={{
        background: "rgba(10,10,20,0.97)",
        border: `1px solid ${border}`,
        backdropFilter: "blur(20px)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${border}`,
      }}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}
        style={{ background: bg }}>
        <Icon size={15} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-bold text-white leading-tight">{title}</p>}
        {message && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button onClick={() => onRemove(id)}
        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 mt-0.5">
        <X size={12} />
      </button>
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const remove = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((type, title, message, duration = 4000) => {
    const id = ++counter.current;
    setToasts(t => [...t, { id, type, title, message }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  // Convenience methods
  toast.success = (title, message, d) => toast("success", title, message, d);
  toast.error   = (title, message, d) => toast("error",   title, message, d);
  toast.warning = (title, message, d) => toast("warning", title, message, d);
  toast.info    = (title, message, d) => toast("info",    title, message, d);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9998] flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <Toast {...t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
