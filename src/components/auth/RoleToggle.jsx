import { motion } from "framer-motion";
import { User, ShieldCheck } from "lucide-react";

const ROLES = [
  { id: "student", icon: User,        label: "Student" },
  { id: "admin",   icon: ShieldCheck, label: "Admin"   },
];

const RoleToggle = ({ role, onChange }) => (
  <div
    className="relative flex p-1 rounded-2xl mb-5"
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
  >
    {/* Sliding pill */}
    <motion.div
      className="absolute top-1 bottom-1 rounded-xl"
      layout
      layoutId="rolePill"
      style={{
        width: "calc(50% - 4px)",
        left: role === "student" ? 4 : "calc(50%)",
        background:
          role === "admin"
            ? "linear-gradient(135deg,rgba(124,58,237,0.55),rgba(139,92,246,0.4))"
            : "linear-gradient(135deg,rgba(79,70,229,0.55),rgba(99,102,241,0.4))",
        boxShadow:
          role === "admin"
            ? "0 0 18px rgba(139,92,246,0.35)"
            : "0 0 18px rgba(99,102,241,0.35)",
        border:
          role === "admin"
            ? "1px solid rgba(139,92,246,0.5)"
            : "1px solid rgba(99,102,241,0.5)",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    />

    {ROLES.map(({ id, icon: Icon, label }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors duration-200"
        style={{ color: role === id ? "#fff" : "#64748b" }}
      >
        <Icon size={13} />
        {label}
      </button>
    ))}
  </div>
);

export default RoleToggle;
