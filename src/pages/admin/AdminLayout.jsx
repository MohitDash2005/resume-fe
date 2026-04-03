import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, FileText, MessageSquare, Sparkles, LogOut, ChevronRight, ShieldCheck, MessageCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";

const links = [
  { id: "dashboard",  icon: LayoutDashboard, label: "Dashboard"   },
  { id: "users",      icon: Users,           label: "Users"        },
  { id: "resumes",    icon: FileText,         label: "Resumes"      },
  { id: "interviews", icon: MessageSquare,    label: "Interviews"   },
  { id: "skills",     icon: Sparkles,         label: "Skills"       },
  { id: "feedback",   icon: MessageCircle,    label: "Feedback"     },
];

const TITLES = {
  dashboard:  "Dashboard",
  users:      "User Management",
  resumes:    "Resume Management",
  interviews: "Interview Management",
  skills:     "Skill Analytics",
  feedback:   "Feedback",
};

const AdminLayout = ({ children, active, setActive }) => {
  const { user, logout } = useApp();

  return (
    <div className="flex min-h-screen bg-[#0a0a14]">
      {/* Sidebar */}
      <motion.aside initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16,1,.3,1] }}
        className="fixed left-0 top-0 h-full w-60 flex flex-col z-40 py-5 px-3"
        style={{
          background: "linear-gradient(180deg, rgba(15,15,28,0.98) 0%, rgba(10,10,20,0.98) 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
        }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-3 mb-7">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
            <ShieldCheck size={17} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Admin Panel</p>
            <p className="text-[10px] text-primary-400 font-semibold tracking-wide">SMART RESUME</p>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest px-3 mb-2">Navigation</p>

        <nav className="flex-1 space-y-0.5">
          {links.map(({ id, icon: Icon, label }, i) => {
            const isActive = active === id;
            return (
              <motion.div key={id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}>
                <button onClick={() => setActive(id)} className="w-full">
                  <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${isActive ? "text-white" : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"}`}
                    style={isActive ? {
                      background: "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(99,102,241,0.1))",
                      border: "1px solid rgba(99,102,241,0.2)",
                      boxShadow: "0 0 16px rgba(99,102,241,0.1)"
                    } : {}}>
                    {isActive && (
                      <motion.div layoutId="adminActiveBar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                        style={{ background: "linear-gradient(180deg,#818cf8,#6366f1)" }} />
                    )}
                    <Icon size={17} className={isActive ? "text-primary-400" : "group-hover:text-slate-300 transition-colors"} />
                    <span className="flex-1 text-left">{label}</span>
                    {isActive && <ChevronRight size={13} className="text-primary-400/60" />}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 pt-3 px-1">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition-colors group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
              {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-600 truncate">{user?.email}</p>
            </div>
            <button onClick={logout}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <motion.header initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="h-14 flex items-center justify-between px-5 sticky top-0 z-30"
          style={{ background: "rgba(8,8,16,0.85)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h1 className="text-sm font-semibold text-white">{TITLES[active]}</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <ShieldCheck size={12} className="text-primary-400" />
            <span className="text-[10px] font-semibold text-primary-300">Admin Mode</span>
          </div>
        </motion.header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
