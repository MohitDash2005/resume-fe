import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trash2, ChevronLeft, ChevronRight, AlertTriangle, Pin } from "lucide-react";
import { adminService } from "../../services/dashboard.service";
import { SkeletonTableRow } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";

const CATEGORY_COLORS = {
  general:   { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  text: "#a5b4fc" },
  resume:    { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  text: "#6ee7b7" },
  interview: { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#fcd34d" },
  ui:        { bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.3)",   text: "#67e8f9" },
  other:     { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)", text: "#94a3b8" },
};

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(n => (
      <Star key={n} size={11} fill={n <= rating ? "#f59e0b" : "transparent"}
        style={{ color: n <= rating ? "#f59e0b" : "rgba(255,255,255,0.15)" }} />
    ))}
  </div>
);

const ConfirmModal = ({ onConfirm, onCancel }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    onClick={onCancel}>
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
      className="w-full max-w-sm rounded-2xl p-6 space-y-4"
      style={{ background: "rgba(12,12,22,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Delete Feedback</p>
          <p className="text-xs text-slate-500">This cannot be undone</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all">Delete</button>
      </div>
    </motion.div>
  </motion.div>
);

const AdminFeedback = () => {
  const [data, setData]         = useState({ feedback: [], total: 0, pages: 1 });
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [pinning, setPinning]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await adminService.feedback(page)); }
    catch (err) { setError(err?.response?.data?.error || "Failed to load feedback"); }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try { await adminService.deleteFeedback(deleting); setDeleting(null); load(); } catch {}
  };

  const handlePin = async (id) => {
    setPinning(id);
    try {
      const { pinned } = await adminService.pinFeedback(id);
      setData(prev => ({ ...prev, feedback: prev.feedback.map(f => f._id === id ? { ...f, pinned } : f) }));
    } catch {} finally { setPinning(null); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <AnimatePresence>
        {deleting && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
      </AnimatePresence>

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">{data.total} submissions total</p>
          <p className="text-[10px] text-slate-600 flex items-center gap-1">
            <Pin size={10} className="text-primary-400" /> Pinned reviews show on the login page
          </p>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(6)].map((_, i) => <SkeletonTableRow key={i} cols={6} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : data.feedback.length === 0 ? (
          <EmptyState icon="💬" title="No feedback yet" message="Users haven't submitted any feedback yet." />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {/* Header */}
            <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
              <span className="col-span-3">User</span>
              <span className="col-span-1">Rating</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-3">Message</span>
              <span className="col-span-1 text-center">Date</span>
              <span className="col-span-1 text-center">Pin</span>
              <span className="col-span-1 text-center">Delete</span>
            </div>
            {data.feedback.map(f => {
              const cat = CATEGORY_COLORS[f.category] || CATEGORY_COLORS.other;
              return (
                <div key={f._id}
                  className="grid grid-cols-12 px-5 py-3 items-start hover:bg-white/[0.02] transition-colors"
                  style={f.pinned ? { background: "rgba(99,102,241,0.04)", borderLeft: "2px solid rgba(99,102,241,0.4)" } : {}}>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                      {f.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{f.user?.name || "Deleted"}</p>
                      <p className="text-[10px] text-slate-600 truncate">{f.user?.email || ""}</p>
                    </div>
                  </div>
                  <div className="col-span-1 pt-0.5"><Stars rating={f.rating} /></div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-lg capitalize"
                      style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text }}>
                      {f.category}
                    </span>
                  </div>
                  <p className="col-span-3 text-xs text-slate-400 leading-relaxed pr-3 line-clamp-2">{f.message}</p>
                  <p className="col-span-1 text-[10px] text-slate-600 text-center pt-0.5">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => handlePin(f._id)} disabled={pinning === f._id}
                      title={f.pinned ? "Unpin from login page" : "Pin to login page"}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                      style={f.pinned
                        ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)" }
                        : { color: "#475569" }}>
                      <Pin size={13} fill={f.pinned ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => setDeleting(f._id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
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

export default AdminFeedback;
