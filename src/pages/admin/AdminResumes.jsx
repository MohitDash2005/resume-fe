import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { adminService } from "../../services/dashboard.service";
import { SkeletonTableRow } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";

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
        <div>
          <p className="text-sm font-bold text-white">Delete Resume</p>
          <p className="text-xs text-slate-500">This action cannot be undone</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all">Delete</button>
      </div>
    </motion.div>
  </motion.div>
);

const ScoreBadge = ({ score }) => {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#6366f1" : score >= 40 ? "#f59e0b" : "#ef4444";
  return <span className="text-xs font-black tabular-nums" style={{ color }}>{score}</span>;
};

const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <ChevronsUpDown size={11} className="text-slate-700" />;
  return sortDir === "asc"
    ? <ChevronUp size={11} className="text-primary-400" />
    : <ChevronDown size={11} className="text-primary-400" />;
};

const SortHeader = ({ label, field, sortField, sortDir, onSort, className = "" }) => (
  <button
    onClick={() => onSort(field)}
    className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide transition-colors
      ${sortField === field ? "text-primary-400" : "text-slate-600 hover:text-slate-400"} ${className}`}
  >
    {label}
    <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
  </button>
);

const AdminResumes = () => {
  const [data, setData]         = useState({ resumes: [], total: 0, pages: 1 });
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [sortField, setSortField] = useState("score");
  const [sortDir, setSortDir]     = useState("desc");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await adminService.resumes(page)); } catch (err) {
      setError(err?.response?.data?.error || "Failed to load resumes");
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try { await adminService.deleteResume(deleting); setDeleting(null); load(); } catch {}
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const sorted = useMemo(() => {
    const rows = [...(data.resumes || [])];
    rows.sort((a, b) => {
      let av, bv;
      if (sortField === "score")   { av = a.analysis?.score || 0;    bv = b.analysis?.score || 0; }
      if (sortField === "ats")     { av = a.analysis?.atsScore || 0; bv = b.analysis?.atsScore || 0; }
      if (sortField === "date")    { av = new Date(a.createdAt);      bv = new Date(b.createdAt); }
      if (sortField === "user")    { av = a.user?.name?.toLowerCase() || ""; bv = b.user?.name?.toLowerCase() || ""; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [data.resumes, sortField, sortDir]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <AnimatePresence>
        {deleting && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
      </AnimatePresence>

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">{data.total} resumes total</p>
          {sortField && (
            <p className="text-[10px] text-slate-600">
              Sorted by <span className="text-primary-400 font-semibold capitalize">{sortField}</span> ({sortDir === "desc" ? "high → low" : "low → high"})
            </p>
          )}
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(6)].map((_, i) => <SkeletonTableRow key={i} cols={6} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : data.resumes.length === 0 ? (
          <EmptyState icon="📄" title="No resumes yet" message="No resumes have been analyzed yet" />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {/* Header */}
            <div className="grid grid-cols-12 px-5 py-2.5">
              <div className="col-span-3">
                <SortHeader label="User" field="user" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </div>
              <span className="col-span-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">File</span>
              <div className="col-span-1 flex justify-center">
                <SortHeader label="Score" field="score" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </div>
              <div className="col-span-1 flex justify-center">
                <SortHeader label="ATS" field="ats" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </div>
              <span className="col-span-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Top Skills</span>
              <div className="col-span-2 flex justify-center">
                <SortHeader label="Date" field="date" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </div>
            </div>

            {sorted.map(r => (
              <motion.div key={r._id} layout
                className="grid grid-cols-12 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors">
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                    {r.user?.avatar ? <img src={r.user.avatar} alt="" className="w-full h-full object-cover" /> : r.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-xs text-slate-300 truncate">{r.user?.name || "—"}</p>
                </div>
                <p className="col-span-3 text-xs text-slate-500 truncate">{r.filename}</p>
                <div className="col-span-1 text-center"><ScoreBadge score={r.analysis?.score || 0} /></div>
                <div className="col-span-1 text-center"><ScoreBadge score={r.analysis?.atsScore || 0} /></div>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {r.analysis?.extractedSkills?.slice(0, 3).map(s => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                      style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>{s}</span>
                  ))}
                </div>
                <div className="col-span-2 flex justify-center items-center gap-1">
                  <span className="text-[10px] text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</span>
                  {r.fileUrl && (
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button onClick={() => setDeleting(r._id)}
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

export default AdminResumes;
