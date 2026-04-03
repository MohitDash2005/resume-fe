import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronLeft, ChevronRight, AlertTriangle, Clock, ChevronUp, ChevronDown, ChevronsUpDown, Eye } from "lucide-react";
import { adminService } from "../../services/dashboard.service";
import { SkeletonTableRow } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";

const GRADE_COLOR = { A: "#10b981", B: "#6366f1", C: "#f59e0b", D: "#f97316", F: "#ef4444" };
const GRADE_LABEL = { A: "Excellent", B: "Good", C: "Average", D: "Poor", F: "Fail" };
const GRADE_ORDER = { A: 5, B: 4, C: 3, D: 2, F: 1 };

const scoreColor = (s) => s >= 80 ? "#10b981" : s >= 60 ? "#6366f1" : s >= 40 ? "#f59e0b" : "#ef4444";

/* ── Score cell with mini bar ── */
const ScoreCell = ({ score }) => {
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-black tabular-nums" style={{ color }}>{score}<span className="text-[9px] text-slate-600 font-normal">/100</span></span>
      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color, boxShadow: `0 0 4px ${color}80` }} />
      </div>
    </div>
  );
};

/* ── Grade badge ── */
const GradeBadge = ({ grade }) => {
  const color = GRADE_COLOR[grade] || "#64748b";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-black" style={{ color }}>{grade}</span>
      <span className="text-[9px]" style={{ color: color + "99" }}>{GRADE_LABEL[grade] || "—"}</span>
    </div>
  );
};

/* ── Detail modal ── */
const DetailModal = ({ session, onClose }) => {
  const [expanded, setExpanded] = useState(null);
  if (!session) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="w-full max-w-xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "#0a0a14", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-sm font-bold text-white">{session.user?.name} — {session.track}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{session.difficulty} · {new Date(session.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreCell score={session.overallScore} />
            <GradeBadge grade={session.grade} />
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
          </div>
        </div>

        {/* Per-question scores */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {!session.answers?.length
            ? <p className="text-xs text-slate-600 text-center py-8">No per-question data saved.</p>
            : session.answers.map((a, i) => {
                const c = scoreColor(a.score);
                const open = expanded === i;
                return (
                  <div key={i} className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${open ? c + "30" : "rgba(255,255,255,0.06)"}`, background: "rgba(255,255,255,0.02)" }}>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      onClick={() => setExpanded(open ? null : i)}>
                      <span className="text-[10px] font-bold text-slate-600 w-5 flex-shrink-0">Q{i + 1}</span>
                      <p className="flex-1 text-xs text-slate-300 truncate">{a.question}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ScoreCell score={a.score} />
                        <GradeBadge grade={a.grade} />
                        {open ? <ChevronUp size={12} className="text-slate-600" /> : <ChevronDown size={12} className="text-slate-600" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold pt-3">Answer</p>
                            <p className="text-xs text-slate-300 leading-relaxed">{a.answer || "—"}</p>
                            {a.breakdown && (
                              <>
                                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Breakdown</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {Object.entries(a.breakdown).map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                                      style={{ background: "rgba(255,255,255,0.03)" }}>
                                      <span className="text-[10px] text-slate-500 capitalize">{k}</span>
                                      <span className="text-[10px] font-bold text-white">{v}/25</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Confirm delete modal ── */
const ConfirmModal = ({ onConfirm, onCancel }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onCancel}>
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
      className="w-full max-w-sm rounded-2xl p-6 space-y-4"
      style={{ background: "rgba(12,12,22,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <p className="text-sm font-bold text-white">Delete this interview session?</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all">Delete</button>
      </div>
    </motion.div>
  </motion.div>
);

/* ── Sort helpers ── */
const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <ChevronsUpDown size={11} className="text-slate-700" />;
  return sortDir === "asc" ? <ChevronUp size={11} className="text-primary-400" /> : <ChevronDown size={11} className="text-primary-400" />;
};
const SortHeader = ({ label, field, sortField, sortDir, onSort, className = "" }) => (
  <button onClick={() => onSort(field)}
    className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide transition-colors
      ${sortField === field ? "text-primary-400" : "text-slate-600 hover:text-slate-400"} ${className}`}>
    {label}<SortIcon field={field} sortField={sortField} sortDir={sortDir} />
  </button>
);

/* ── Main component ── */
const AdminInterviews = () => {
  const [data, setData]           = useState({ sessions: [], total: 0, pages: 1, trackStats: [] });
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [sortField, setSortField] = useState("score");
  const [sortDir, setSortDir]     = useState("desc");
  const [detail, setDetail]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await adminService.interviews(page)); } catch (err) {
      setError(err?.response?.data?.error || "Failed to load interviews");
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try { await adminService.deleteInterview(deleting); setDeleting(null); load(); } catch {}
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await adminService.interviewDetail(id);
      setDetail(res.session);
    } catch { setDetail(null); }
    setDetailLoading(false);
  };

  const sorted = useMemo(() => {
    const rows = [...(data.sessions || [])];
    rows.sort((a, b) => {
      let av, bv;
      if (sortField === "score")    { av = a.overallScore || 0;                  bv = b.overallScore || 0; }
      if (sortField === "grade")    { av = GRADE_ORDER[a.grade] || 0;            bv = GRADE_ORDER[b.grade] || 0; }
      if (sortField === "duration") { av = a.duration || 0;                      bv = b.duration || 0; }
      if (sortField === "date")     { av = new Date(a.createdAt);                bv = new Date(b.createdAt); }
      if (sortField === "user")     { av = a.user?.name?.toLowerCase() || "";    bv = b.user?.name?.toLowerCase() || ""; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [data.sessions, sortField, sortDir]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <AnimatePresence>
        {deleting && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
        {detailLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
            <div className="w-8 h-8 border-2 border-white/10 border-t-violet-400 rounded-full animate-spin" />
          </motion.div>
        )}
        {detail && !detailLoading && <DetailModal session={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>

      {/* Score legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Score Legend:</span>
        {[["80–100", "#10b981", "Excellent"], ["60–79", "#6366f1", "Good"], ["40–59", "#f59e0b", "Average"], ["0–39", "#ef4444", "Poor"]].map(([range, color, label]) => (
          <div key={range} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-slate-500">{range} <span style={{ color }}>{label}</span></span>
          </div>
        ))}
      </div>

      {/* Track stats */}
      {data.trackStats?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.trackStats.map(t => {
            const avg = Math.round(t.avgScore);
            const color = scoreColor(avg);
            return (
              <div key={t._id} className="card text-center py-3 space-y-1">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Avg Score</p>
                <p className="text-2xl font-black" style={{ color }}>{avg}<span className="text-[10px] text-slate-600 font-normal">/100</span></p>
                <div className="w-16 h-1 rounded-full overflow-hidden mx-auto" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${avg}%`, background: color }} />
                </div>
                <p className="text-xs font-bold text-white">{t._id}</p>
                <p className="text-[9px] text-slate-700">{t.count} session{t.count !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">{data.total} sessions total</p>
          <p className="text-[10px] text-slate-600">
            Sorted by <span className="text-primary-400 font-semibold capitalize">{sortField}</span> ({sortDir === "desc" ? "high → low" : "low → high"})
          </p>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(6)].map((_, i) => <SkeletonTableRow key={i} cols={8} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : data.sessions.length === 0 ? (
          <EmptyState icon="🎯" title="No interview sessions" message="No completed interviews yet" />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {/* Header */}
            <div className="grid grid-cols-12 px-5 py-2.5 gap-1">
              <div className="col-span-3"><SortHeader label="User" field="user" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></div>
              <span className="col-span-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Track</span>
              <span className="col-span-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Diff</span>
              <div className="col-span-1 flex justify-center"><SortHeader label="Score" field="score" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></div>
              <div className="col-span-1 flex justify-center"><SortHeader label="Grade" field="grade" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></div>
              <div className="col-span-2 flex justify-center"><SortHeader label="Duration" field="duration" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></div>
              <div className="col-span-1 flex justify-center"><SortHeader label="Date" field="date" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></div>
              <span className="col-span-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-center">Actions</span>
            </div>

            {sorted.map(s => (
              <motion.div key={s._id} layout
                className="grid grid-cols-12 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors gap-1">
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                    {s.user?.avatar ? <img src={s.user.avatar} alt="" className="w-full h-full object-cover" /> : s.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">{s.user?.name || "—"}</p>
                    <p className="text-[9px] text-slate-600 truncate">{s.user?.email || ""}</p>
                  </div>
                </div>
                <p className="col-span-2 text-xs text-slate-400">{s.track}</p>
                <p className="col-span-1 text-[10px] text-slate-600">{s.difficulty}</p>
                <div className="col-span-1 flex justify-center"><ScoreCell score={s.overallScore || 0} /></div>
                <div className="col-span-1 flex justify-center"><GradeBadge grade={s.grade} /></div>
                <div className="col-span-2 flex items-center justify-center gap-1 text-[10px] text-slate-600">
                  <Clock size={10} />{fmt(s.duration || 0)}
                </div>
                <p className="col-span-1 text-[10px] text-slate-600 text-center">{new Date(s.createdAt).toLocaleDateString()}</p>
                <div className="col-span-1 flex justify-center gap-1">
                  <button onClick={() => openDetail(s._id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                    title="View per-question scores">
                    <Eye size={13} />
                  </button>
                  <button onClick={() => setDeleting(s._id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-slate-500">Page {page} of {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AdminInterviews;
