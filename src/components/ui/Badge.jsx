const variants = {
  indigo:  "bg-primary-500/15 text-primary-300 border border-primary-500/20",
  green:   "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  red:     "bg-red-500/15 text-red-300 border border-red-500/20",
  amber:   "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  slate:   "bg-white/5 text-slate-300 border border-white/10",
};

const Badge = ({ label, variant = "indigo", icon }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
    {icon && <span className="text-[10px]">{icon}</span>}
    {label}
  </span>
);

export default Badge;
