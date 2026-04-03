import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, ChevronLeft, ChevronRight, X, AlertTriangle } from "lucide-react";
import { adminService } from "../../services/dashboard.service";
import { SkeletonTableRow } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";

const ConfirmModal = ({ name, onConfirm, onCancel }) => (
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
          <p className="text-sm font-bold text-white">Delete User</p>
          <p className="text-xs text-slate-500">This will delete all their data</p>
        </div>
      </div>
      <p className="text-xs text-slate-400">Are you sure you want to delete <span className="text-white font-semibold">{name}</span>? This cannot be undone.</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all">Delete</button>
      </div>
    </motion.div>
  </motion.div>
);

const AdminUsers = () => {
  const [data, setData]       = useState({ users: [], total: 0, pages: 1 });
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await adminService.users(page, query)); } catch (err) {
      setError(err?.response?.data?.error || "Failed to load users");
    }
    setLoading(false);
  }, [page, query]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await adminService.deleteUser(deleting._id);
      setDeleting(null);
      load();
    } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <AnimatePresence>
        {deleting && <ConfirmModal name={deleting.name} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
      </AnimatePresence>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setQuery(search); setPage(1); } }}
            placeholder="Search by name or email… (Enter to search)"
            className="input-field pl-10 text-sm" />
          {search && (
            <button onClick={() => { setSearch(""); setQuery(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>
        <button onClick={() => { setQuery(search); setPage(1); }}
          className="btn-primary px-5 text-sm">Search</button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">{data.total} users total</p>
        </div>
        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(6)].map((_, i) => <SkeletonTableRow key={i} cols={6} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : data.users.length === 0 ? (
          <EmptyState icon="👥" title="No users found" message={query ? `No results for "${query}"` : "No users have signed up yet"} />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {/* Header */}
            <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
              <span className="col-span-4">User</span>
              <span className="col-span-3">Email</span>
              <span className="col-span-1 text-center">Resumes</span>
              <span className="col-span-1 text-center">Interviews</span>
              <span className="col-span-2 text-center">Joined</span>
              <span className="col-span-1 text-center">Action</span>
            </div>
            {data.users.map(u => (
              <div key={u._id} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                    {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                    {u.isAdmin && <span className="text-[9px] text-primary-400 font-bold">ADMIN</span>}
                  </div>
                </div>
                <p className="col-span-3 text-xs text-slate-500 truncate">{u.email || u.phone || "—"}</p>
                <p className="col-span-1 text-xs text-white font-bold text-center">{u.resumeCount}</p>
                <p className="col-span-1 text-xs text-white font-bold text-center">{u.interviewCount}</p>
                <p className="col-span-2 text-[10px] text-slate-600 text-center">{new Date(u.createdAt).toLocaleDateString()}</p>
                <div className="col-span-1 flex justify-center">
                  <button onClick={() => setDeleting(u)} disabled={u.isAdmin}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
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

export default AdminUsers;
