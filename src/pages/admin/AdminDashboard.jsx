import { motion } from "framer-motion";
import { Users, FileText, MessageSquare, Award, BarChart2, Activity, Star, MessageCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { adminService } from "../../services/dashboard.service";
import useApi from "../../hooks/useApi";
import { SkeletonAdminStats, SkeletonChart } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/EmptyState";

const SCORE_COLORS    = ["#ef4444", "#f59e0b", "#6366f1", "#10b981"];
const CATEGORY_COLORS = {
  general:   "#6366f1",
  resume:    "#10b981",
  interview: "#f59e0b",
  ui:        "#06b6d4",
  other:     "#94a3b8",
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className="card flex items-start gap-4">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-700 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(n => (
      <Star key={n} size={14}
        fill={n <= Math.round(rating) ? "#f59e0b" : "transparent"}
        style={{ color: n <= Math.round(rating) ? "#f59e0b" : "rgba(255,255,255,0.12)" }} />
    ))}
  </div>
);

const AdminDashboard = () => {
  const { data: stats, loading, error, refetch } = useApi(adminService.stats);

  if (loading) return (
    <div className="space-y-6">
      <SkeletonAdminStats />
      <div className="grid lg:grid-cols-3 gap-4">
        <SkeletonChart height={180} />
        <div className="card">
          <div className="shimmer-bg h-4 w-32 rounded-xl mb-4" />
          <div className="shimmer-bg w-full h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="card"><ErrorState message={error} onRetry={refetch} /></div>
  );

  const pieData      = stats?.scoreDistribution?.map(b => ({ name: b.range, value: b.count })) || [];
  const categoryData = stats?.feedbackByCategory || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Users"      value={stats?.totalUsers      || 0} color="#6366f1" sub={`+${stats?.newUsersThisWeek || 0} this week`} />
        <StatCard icon={FileText}      label="Resumes Analyzed" value={stats?.totalResumes    || 0} color="#10b981" />
        <StatCard icon={MessageSquare} label="Interviews Done"  value={stats?.totalInterviews || 0} color="#f59e0b" />
        <StatCard icon={Award}         label="Avg Resume Score" value={`${stats?.avgResumeScore || 0}/100`} color="#ec4899" sub={`Interview avg: ${stats?.avgInterviewScore || 0}`} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Activity trend */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-primary-400" />
            <h3 className="text-sm font-bold text-white">Resume Activity — Last 30 Days</h3>
          </div>
          {!stats?.activityTrend?.length ? (
            <div className="flex items-center justify-center h-44">
              <p className="text-xs text-slate-600">No activity data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats.activityTrend} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgba(12,12,22,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 11 }} />
                <Area type="monotone" dataKey="resumes" stroke="#6366f1" strokeWidth={2} fill="url(#adminGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-primary-400" />
            <h3 className="text-sm font-bold text-white">Score Distribution</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={SCORE_COLORS[i % SCORE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(12,12,22,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: SCORE_COLORS[i % SCORE_COLORS.length] }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-white font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-36">
              <p className="text-xs text-slate-600">No score data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Feedback stats ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Avg rating card */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={15} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white">User Feedback</h3>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 gap-2 py-2">
            <p className="text-5xl font-black text-white tabular-nums">
              {stats?.feedbackAvgRating?.toFixed(1) || "—"}
            </p>
            <StarRating rating={stats?.feedbackAvgRating || 0} />
            <p className="text-xs text-slate-500 mt-1">
              Based on <span className="text-white font-bold">{stats?.feedbackTotal || 0}</span> reviews
            </p>
          </div>
          {/* Mini radial */}
          {stats?.feedbackTotal > 0 && (
            <ResponsiveContainer width="100%" height={70}>
              <RadialBarChart cx="50%" cy="100%" innerRadius="60%" outerRadius="100%"
                startAngle={180} endAngle={0}
                data={[{ value: ((stats?.feedbackAvgRating || 0) / 5) * 100, fill: "#f59e0b" }]}>
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(255,255,255,0.04)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Star size={15} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Feedback by Category</h3>
          </div>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-xs text-slate-600">No feedback yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryData.map(({ category, count }) => {
                const color = CATEGORY_COLORS[category] || "#94a3b8";
                const max   = categoryData[0]?.count || 1;
                const pct   = Math.round((count / max) * 100);
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold capitalize" style={{ color }}>{category}</span>
                      <span className="text-xs text-slate-500">{count} review{count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default AdminDashboard;
