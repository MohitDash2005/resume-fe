import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, CheckCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { adminSearchSkill, adminGetTopSkills } from "../../api/resumeApi";

const UserRow = ({ user, score, has }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
    style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden"
      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
      {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
      <p className="text-[10px] text-slate-600 truncate">{user?.email}</p>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {score !== undefined && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
          Score: {score}
        </span>
      )}
      {has
        ? <CheckCircle size={14} className="text-emerald-400" />
        : <XCircle size={14} className="text-red-400" />
      }
    </div>
  </div>
);

const AdminSkills = () => {
  const [query, setQuery]     = useState("");
  const [input, setInput]     = useState("");
  const [result, setResult]   = useState(null);
  const [topSkills, setTopSkills] = useState({ present: [], missing: [] });
  const [searching, setSearching] = useState(false);
  const [loadingTop, setLoadingTop] = useState(true);
  const [tab, setTab]         = useState("have"); // "have" | "missing"

  useEffect(() => {
    adminGetTopSkills().then(setTopSkills).finally(() => setLoadingTop(false));
  }, []);

  const handleSearch = async () => {
    if (!input.trim()) return;
    setSearching(true); setQuery(input.trim()); setResult(null);
    try { setResult(await adminSearchSkill(input.trim())); } catch {}
    setSearching(false);
  };

  const clear = () => { setInput(""); setQuery(""); setResult(null); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Search */}
      <div className="card space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Search by Skill</h3>
          <p className="text-xs text-slate-500">Find which users have or are missing a specific skill</p>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="e.g. React, Docker, Python, AWS…"
              className="input-field pl-10 text-sm" />
            {input && (
              <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={handleSearch} disabled={searching || !input.trim()}
            className="btn-primary px-6 text-sm disabled:opacity-40">
            {searching ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Search"}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <p className="text-2xl font-black text-emerald-400">{result.haveIt?.length || 0}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Users have <span className="text-white font-semibold">"{result.skill}"</span></p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <p className="text-2xl font-black text-red-400">{result.missingIt?.length || 0}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Users missing <span className="text-white font-semibold">"{result.skill}"</span></p>
                </div>
              </div>

              {/* Tab switch */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {[{ id: "have", label: `Have it (${result.haveIt?.length || 0})`, color: "text-emerald-400" },
                  { id: "missing", label: `Missing it (${result.missingIt?.length || 0})`, color: "text-red-400" }].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === t.id ? "text-white" : "text-slate-600 hover:text-slate-400"}`}
                    style={tab === t.id ? { background: "linear-gradient(135deg,rgba(79,70,229,0.3),rgba(99,102,241,0.2))", border: "1px solid rgba(99,102,241,0.25)" } : {}}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* User list */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(tab === "have" ? result.haveIt : result.missingIt)?.length === 0
                  ? <p className="text-xs text-slate-600 text-center py-6">No users found</p>
                  : (tab === "have" ? result.haveIt : result.missingIt).map((r, i) => (
                      <UserRow key={i} user={r.user} score={r.score} has={tab === "have"} />
                    ))
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top skills */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Most present */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Most Common Skills</h3>
          </div>
          {loadingTop ? (
            <div className="flex justify-center py-6"><span className="w-5 h-5 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {topSkills.present?.slice(0, 10).map((s, i) => (
                <div key={s._id} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-600 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.round((s.count / (topSkills.present[0]?.count || 1)) * 100)}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
                    </div>
                    <span className="text-xs text-slate-300 w-24 truncate">{s._id}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 w-6 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most missing */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={14} className="text-red-400" />
            <h3 className="text-sm font-bold text-white">Most Missing Skills</h3>
          </div>
          {loadingTop ? (
            <div className="flex justify-center py-6"><span className="w-5 h-5 border-2 border-white/10 border-t-red-400 rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {topSkills.missing?.slice(0, 10).map((s, i) => (
                <div key={s._id} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-600 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.round((s.count / (topSkills.missing[0]?.count || 1)) * 100)}%`, background: "linear-gradient(90deg,#ef4444,#f87171)" }} />
                    </div>
                    <span className="text-xs text-slate-300 w-24 truncate">{s._id}</span>
                  </div>
                  <span className="text-xs font-bold text-red-400 w-6 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSkills;
