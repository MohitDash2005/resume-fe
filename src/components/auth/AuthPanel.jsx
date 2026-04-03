import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ShieldCheck } from "lucide-react";
import RoleToggle from "./RoleToggle";
import AuthForm from "./AuthForm";

const AuthPanel = ({ onSuccess }) => {
  const [role, setRole] = useState("student");
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSuccess = (admin = false) => {
    setIsAdmin(admin);
    setSuccess(true);
    setTimeout(() => onSuccess(admin), 900);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full px-6 py-10 relative overflow-hidden"
      style={{
        background: "radial-gradient(circle at top left, rgba(99,102,241,0.08), transparent 28%), linear-gradient(180deg, #010108 0%, #03030b 45%, #000000 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(0,0,0,0.2), rgba(2,6,23,0.55) 45%, rgba(0,0,0,0.8) 100%)",
        }}
      />
      <motion.div
        className="w-full max-w-[420px] relative z-10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Glassmorphism card ── */}
        <motion.div
          animate={{
            borderColor:
              role === "admin" ? "rgba(139,92,246,0.28)" : "rgba(255,255,255,0.09)",
          }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(180deg, rgba(3,3,10,0.98) 0%, rgba(6,6,16,0.98) 45%, rgba(1,1,6,0.99) 100%)",
            backdropFilter: "blur(48px) saturate(200%)",
            WebkitBackdropFilter: "blur(48px) saturate(200%)",
            boxShadow:
              "0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <AnimatePresence mode="wait">
            {success ? (
              /* ── Success state ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: isAdmin
                      ? "rgba(139,92,246,0.15)"
                      : "rgba(16,185,129,0.15)",
                    boxShadow: isAdmin
                      ? "0 0 32px rgba(139,92,246,0.4)"
                      : "0 0 32px rgba(16,185,129,0.4)",
                  }}
                >
                  {isAdmin
                    ? <ShieldCheck size={32} className="text-violet-400" />
                    : <CheckCircle size={32} className="text-emerald-400" />}
                </motion.div>
                <p className="text-white font-bold">
                  {isAdmin ? "Welcome, Admin!" : "Welcome back!"}
                </p>
                <p className="text-slate-500 text-xs">
                  Redirecting to {isAdmin ? "admin panel" : "dashboard"}…
                </p>
              </motion.div>
            ) : (
              /* ── Auth flow ── */
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* 1. Role selection */}
                <RoleToggle role={role} onChange={(r) => setRole(r)} />

                {/* 2. Form (Sign In / Sign Up + inputs + button) */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={role}
                    initial={{ opacity: 0, x: role === "admin" ? 12 : -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: role === "admin" ? -12 : 12 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AuthForm role={role} onSuccess={handleSuccess} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Legal footnote ── */}
        <p className="text-center text-[11px] text-slate-700 mt-3">
          By continuing, you agree to our{" "}
          <span className="text-indigo-500 cursor-pointer hover:text-indigo-400 transition-colors">
            Terms
          </span>{" "}
          &{" "}
          <span className="text-indigo-500 cursor-pointer hover:text-indigo-400 transition-colors">
            Privacy Policy
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPanel;
