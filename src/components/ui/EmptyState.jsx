import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button";

export const EmptyState = ({ icon = "📭", title = "Nothing here yet", message, action, actionLabel = "Get Started" }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 gap-4 text-center"
  >
    <div className="text-5xl mb-1">{icon}</div>
    <div>
      <p className="text-white font-bold text-base">{title}</p>
      {message && <p className="text-slate-500 text-sm mt-1 max-w-xs">{message}</p>}
    </div>
    {action && (
      <Button onClick={action} className="mt-2 text-sm px-5 py-2.5">
        {actionLabel}
      </Button>
    )}
  </motion.div>
);

export const ErrorState = ({ message = "Something went wrong", onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 gap-4 text-center"
  >
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
      <AlertCircle size={22} className="text-red-400" />
    </div>
    <div>
      <p className="text-white font-bold text-sm">Failed to load data</p>
      <p className="text-slate-500 text-xs mt-1 max-w-xs">{message}</p>
    </div>
    {onRetry && (
      <button onClick={onRetry}
        className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors">
        <RefreshCw size={13} /> Try again
      </button>
    )}
  </motion.div>
);

export default EmptyState;
