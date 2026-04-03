const Skeleton = ({ className = "" }) => (
  <div className={`shimmer-bg rounded-xl ${className}`} />
);

/* ── Generic card skeleton ── */
export const SkeletonCard = ({ lines = 2 }) => (
  <div className="card space-y-3">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-7 w-1/2" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-3 ${i % 2 === 0 ? "w-full" : "w-4/5"}`} />
    ))}
  </div>
);

/* ── Stat card row (4 cards) ── */
export const SkeletonStatRow = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="card space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-14 h-5 rounded-full" />
        </div>
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);

/* ── Chart skeleton ── */
export const SkeletonChart = ({ height = 175 }) => (
  <div className="card space-y-4">
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-7 w-28 rounded-lg" />
    </div>
    <Skeleton className={`w-full rounded-xl`} style={{ height }} />
  </div>
);

/* ── Dashboard full skeleton ── */
export const SkeletonDashboard = () => (
  <div className="space-y-5 pb-6">
    {/* Banner */}
    <div className="card p-6 flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-9 w-28 rounded-xl hidden sm:block" />
    </div>
    <SkeletonStatRow />
    <div className="grid lg:grid-cols-3 gap-4">
      <SkeletonChart height={175} />
      <div className="card flex flex-col items-center gap-4 py-6">
        <Skeleton className="w-28 h-28 rounded-full" />
        <div className="w-full space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="grid lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
    </div>
  </div>
);

/* ── Result page skeleton ── */
export const SkeletonResult = () => (
  <div className="max-w-3xl mx-auto space-y-5 pb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
    <div className="grid sm:grid-cols-5 gap-4">
      <div className="card sm:col-span-2 flex flex-col items-center gap-4 py-8">
        <Skeleton className="w-40 h-40 rounded-full" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="card sm:col-span-3">
        <Skeleton className="h-3 w-24 mb-4" />
        <Skeleton className="w-full h-52 rounded-xl" />
      </div>
    </div>
    <SkeletonCard lines={4} />
  </div>
);

/* ── Table row skeleton ── */
export const SkeletonTableRow = ({ cols = 6 }) => (
  <div className="grid px-5 py-3 items-center gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {[...Array(cols)].map((_, i) => (
      <Skeleton key={i} className={`h-4 ${i === 0 ? "w-3/4" : i === cols - 1 ? "w-8 mx-auto" : "w-full"}`} />
    ))}
  </div>
);

/* ── Admin stat row ── */
export const SkeletonAdminStats = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="card flex items-start gap-4">
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
