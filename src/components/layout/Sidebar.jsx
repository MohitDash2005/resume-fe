import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, FileText, MessageSquare, LogOut, Zap, ChevronRight, ShieldCheck, Sparkles, History, MessageCircle, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context/AppContext";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard",  badge: null,    color: "#6366f1" },
  { to: "/upload",    icon: Upload,           label: "Upload",     badge: "New",   color: "#06b6d4" },
  { to: "/results",   icon: FileText,         label: "Results",    badge: null,    color: "#10b981" },
  { to: "/interview", icon: MessageSquare,    label: "Interview",  badge: "AI",    color: "#8b5cf6" },
  { to: "/history",   icon: History,          label: "History",    badge: null,    color: "#f59e0b" },
  { to: "/practice",  icon: Building2,        label: "Premium Interview", badge: "Hot",   color: "#ec4899" },
];

const Sidebar = ({ onLogout, onFeedback }) => {
  const { user } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <>
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-40 py-5 px-3"
      style={{
        background: "linear-gradient(180deg, rgba(6,6,16,0.99) 0%, rgba(2,2,10,0.99) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 px-3 mb-8"
      >
        <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
            boxShadow: "0 0 24px rgba(99,102,241,0.45)",
          }}>
          <Zap size={17} className="text-white" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#02020a]"
            style={{ boxShadow: "0 0 6px rgba(16,185,129,0.9)" }} />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm leading-tight tracking-tight">
            <span className="text-cyan-400">Smart</span>{" "}
            <span className="text-violet-400">Resume</span>{" "}
            <span className="text-emerald-400">Analyzer</span>
          </p>
        </div>
      </motion.div>

      {/* Section label */}
      <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest px-3 mb-2">Navigation</p>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {links.map(({ to, icon: Icon, label, badge, color }, i) => {
          const isActive = pathname === to;
          return (
            <motion.div key={to}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavLink to={to} className="block">
                <div
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
                    ${isActive ? "text-white" : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"}`}
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                    border: `1px solid ${color}28`,
                    boxShadow: `0 0 20px ${color}10`,
                  } : {}}
                >
                  {/* Active left bar */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="activeBar"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        exit={{ scaleY: 0 }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                        style={{ background: `linear-gradient(180deg, ${color}, ${color}80)` }}
                      />
                    )}
                  </AnimatePresence>

                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200`}
                    style={isActive
                      ? { background: `${color}20`, boxShadow: `0 0 10px ${color}30` }
                      : { background: "rgba(255,255,255,0.04)" }}>
                    <Icon size={14} style={{ color: isActive ? color : undefined }}
                      className={!isActive ? "text-slate-600 group-hover:text-slate-400 transition-colors" : ""} />
                  </div>

                  <span className="flex-1">{label}</span>

                  {badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md
                      ${badge === "New"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : badge === "Hot"
                        ? "bg-pink-500/15 text-pink-400 border border-pink-500/20"
                        : "bg-violet-500/15 text-violet-400 border border-violet-500/20"}`}>
                      {badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={12} style={{ color }} className="opacity-60" />}
                </div>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Admin link */}
      {user?.isAdmin && (
        <div className="mx-1 mb-3">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/admin")}
            className="w-full flex items-center gap-2.5 p-3 rounded-xl transition-all group"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.15)" }}>
              <ShieldCheck size={13} className="text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">Admin Panel</p>
              <p className="text-[10px] text-slate-600 truncate">Manage platform</p>
            </div>
            <Sparkles size={11} className="text-violet-400/60 ml-auto" />
          </motion.button>
        </div>
      )}

      {/* Feedback button */}
      <div className="px-1 mb-2">
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={onFeedback}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl transition-all group"
          style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.15)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(6,182,212,0.12)" }}>
            <MessageCircle size={13} className="text-cyan-400" />
          </div>
          <p className="text-xs font-bold text-white">Give Feedback</p>
        </motion.button>
      </div>

      {/* User profile */}
      <div className="border-t pt-3 mt-1 px-1" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.03] transition-colors group cursor-pointer">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden"
            style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)", boxShadow: "0 0 12px rgba(99,102,241,0.35)" }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : user?.name?.[0]?.toUpperCase() || "U"
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || "User"}</p>
            <p className="text-[10px] text-slate-600 truncate">{user?.email || user?.phone || ""}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </motion.aside>

    </>
  );
};

export default Sidebar;
