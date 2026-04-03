import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Phone } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useToast } from "../ui/Toast";
import { loginUser } from "../../api/resumeApi";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/* ── Password strength ── */
const getStrength = (p) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f59e0b", "#eab308", "#10b981"];

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const s = getStrength(password);
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{ backgroundColor: i <= s ? STRENGTH_COLOR[s] : "rgba(255,255,255,0.06)" }}
            transition={{ duration: 0.3 }}
            className="flex-1 h-1 rounded-full"
          />
        ))}
      </div>
      <p className="text-[10px] font-semibold" style={{ color: STRENGTH_COLOR[s] }}>{STRENGTH_LABEL[s]}</p>
    </motion.div>
  );
};

/* ── Floating label input ── */
const FloatingInput = ({ icon: Icon, type = "text", label, value, onChange, right, error }) => {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="space-y-1">
      <div className="relative">
        <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 z-10" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          className={`input-field pl-10 pr-10 pt-6 pb-2.5 peer ${error ? "border-red-500/40 focus:border-red-500/60" : ""}`}
        />
        <motion.label
          animate={{ top: lifted ? "6px" : "50%", fontSize: lifted ? "9px" : "12px", y: lifted ? 0 : "-50%" }}
          transition={{ duration: 0.15 }}
          className="absolute left-10 pointer-events-none font-medium"
          style={{ color: focused ? "rgba(99,102,241,0.8)" : "#475569", transformOrigin: "left" }}
        >
          {label}
        </motion.label>
        {right && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">{right}</div>}
      </div>
      {error && <p className="text-[10px] text-red-400 pl-1">{error}</p>}
    </div>
  );
};

/* ── Sign In / Sign Up tab bar ── */
const AuthTabBar = ({ isLogin, onChange }) => (
  <div
    className="relative flex p-1 rounded-xl mb-6"
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
  >
    <motion.div
      className="absolute top-1 bottom-1 rounded-lg"
      layout
      layoutId="authTab"
      style={{
        width: "calc(50% - 4px)",
        left: isLogin ? 4 : "calc(50%)",
        background: "linear-gradient(135deg,#3730a3,#4f46e5,#6366f1,#818cf8)",
        boxShadow: "0 0 28px rgba(99,102,241,0.5)",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    />
    {["Sign In", "Sign Up"].map((t, i) => (
      <button
        key={t}
        onClick={() => onChange(i === 0)}
        className="relative z-10 flex-1 py-3 rounded-lg text-base font-bold transition-colors duration-200"
        style={{ color: (isLogin ? i === 0 : i === 1) ? "#fff" : "#64748b" }}
      >
        {t}
      </button>
    ))}
  </div>
);

/* ── Student form ── */
const StudentForm = ({ onSuccess }) => {
  const [isLogin, setIsLogin]     = useState(true);
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [signupMode, setSignupMode] = useState("email"); // "email" | "phone"
  const [form, setForm]           = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors]       = useState({});
  const [serverError, setServerError] = useState("");
  const { login, register } = useApp();
  const toast = useToast();

  // Auto-detect whether the login identifier is email or phone
  const loginIsPhone = (v) => /^[\+0-9][\d\s\-()]{6,}$/.test(v.trim());

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
    setServerError("");
  };

  const validate = () => {
    const e = {};
    if (!isLogin && !form.name.trim()) e.name = "Name is required";
    if (isLogin) {
      if (!form.email.trim()) e.email = "Email or phone is required";
    } else {
      if (signupMode === "email" && !form.email.includes("@")) e.email = "Enter a valid email";
      if (signupMode === "phone" && !/^\+?[0-9]{7,15}$/.test(form.phone.replace(/[\s\-()]/g, ""))) {
        e.phone = "Enter a valid phone number";
      }
    }
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      if (isLogin) {
        // Auto-detect email vs phone
        const identifier = form.email.trim();
        const payload = loginIsPhone(identifier)
          ? { phone: identifier, password: form.password }
          : { email: identifier, password: form.password };
        await login(payload);
      } else {
        const payload = { name: form.name, password: form.password };
        if (signupMode === "email") payload.email = form.email;
        else payload.phone = form.phone;
        await register(payload);
      }
      toast.success(isLogin ? "Welcome back!" : "Account created!", "Redirecting...");
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.error || "Something went wrong.";
      setServerError(msg);
      toast.error("Authentication failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthTabBar isLogin={isLogin} onChange={(v) => { setIsLogin(v); setErrors({}); setServerError(""); }} />

      <AnimatePresence mode="wait">
        <motion.form
          key={isLogin ? "login" : `signup-${signupMode}`}
          initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
          transition={{ duration: 0.18 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {!isLogin && (
            <FloatingInput icon={User} label="Full name" value={form.name} onChange={set("name")} error={errors.name} />
          )}

          {/* Sign-up mode toggle: Email / Phone */}
          {!isLogin && (
            <div className="flex gap-1 p-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {["email", "phone"].map(m => (
                <button key={m} type="button" onClick={() => { setSignupMode(m); setErrors({}); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                    ${signupMode === m ? "text-white" : "text-slate-600 hover:text-slate-400"}`}
                  style={signupMode === m ? { background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.3)" } : {}}>
                  {m === "email" ? <Mail size={11} /> : <Phone size={11} />}
                  {m === "email" ? "Email" : "Phone"}
                </button>
              ))}
            </div>
          )}

          {/* Email field — login (email or phone) or signup email mode */}
          {(isLogin || signupMode === "email") && (
            <FloatingInput
              icon={isLogin ? Mail : Mail}
              type={isLogin ? "text" : "email"}
              label={isLogin ? "Email or phone number" : "Email address"}
              value={form.email}
              onChange={set("email")}
              error={errors.email}
            />
          )}

          {/* Phone field — signup phone mode only */}
          {!isLogin && signupMode === "phone" && (
            <FloatingInput
              icon={Phone}
              type="tel"
              label="Phone number (e.g. +1 234 567 8900)"
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
            />
          )}

          <div>
            <FloatingInput
              icon={Lock}
              type={showPass ? "text" : "password"}
              label="Password"
              value={form.password}
              onChange={set("password")}
              error={errors.password}
              right={
                <button type="button" onClick={() => setShowPass((s) => !s)} className="text-slate-600 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />
            {!isLogin && <PasswordStrength password={form.password} />}
          </div>

          {serverError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 px-3"
            >
              {serverError}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            whileHover={{ boxShadow: "0 0 52px rgba(99,102,241,0.65)" }}
            className="w-full py-4 mt-1 flex items-center justify-center gap-2 disabled:opacity-50 rounded-2xl font-bold text-lg text-white transition-all"
            style={{ background: "linear-gradient(135deg,#3730a3,#4f46e5,#6366f1,#818cf8)", backgroundSize: "200% 200%", boxShadow: "0 0 32px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)" }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><span>{isLogin ? "Sign In" : "Create Account"}</span><ArrowRight size={15} /></>
            )}
          </motion.button>
        </motion.form>
      </AnimatePresence>

      {/* OAuth */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="text-[11px] text-slate-700">or continue with</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Google", emoji: "🌐", href: `${API_BASE}/auth/google` },
          { label: "GitHub", emoji: "🐙", href: `${API_BASE}/auth/github` },
        ].map(({ label, emoji, href }) => (
          <motion.a
            key={label}
            href={href}
            whileHover={{ y: -1, borderColor: "rgba(255,255,255,0.14)" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-base text-slate-400 font-medium transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span>{emoji}</span> {label}
          </motion.a>
        ))}
      </div>
    </>
  );
};

/* ── Admin form ── */
const AdminForm = ({ onSuccess }) => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [serverError, setServerError] = useState("");
  const { setUser } = useApp();

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    setServerError("");
    try {
      const user = await loginUser({ email: form.email, password: form.password });
      if (!user?.isAdmin) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setServerError("This account does not have admin privileges.");
        setLoading(false);
        return;
      }
      setUser(user);
      onSuccess(true);
    } catch (err) {
      setServerError(err?.response?.data?.error || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-center gap-2 mb-6 py-3.5 rounded-xl"
        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <ShieldCheck size={15} className="text-violet-400" />
        <span className="text-sm font-bold text-violet-300">Admin Access Only</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FloatingInput
          icon={Mail}
          type="email"
          label="Admin email"
          value={form.email}
          onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setServerError(""); }}
        />
        <FloatingInput
          icon={Lock}
          type={showPass ? "text" : "password"}
          label="Admin password"
          value={form.password}
          onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setServerError(""); }}
          right={
            <button type="button" onClick={() => setShowPass((s) => !s)} className="text-slate-600 hover:text-slate-300 transition-colors">
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />

        {serverError && (
          <p className="text-[11px] text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 px-3">
            {serverError}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          whileHover={{ boxShadow: "0 0 52px rgba(139,92,246,0.65)" }}
          className="w-full py-4 mt-1 flex items-center justify-center gap-2 disabled:opacity-50 rounded-2xl font-bold text-lg text-white transition-all"
          style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6,#a78bfa)", backgroundSize: "200% 200%", boxShadow: "0 0 32px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15)" }}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><ShieldCheck size={15} /><span>Sign In as Admin</span></>
          )}
        </motion.button>
      </form>

      <p className="text-center text-[10px] text-slate-700 mt-4">Unauthorized access attempts are logged.</p>
    </>
  );
};

const AuthForm = ({ role, onSuccess }) =>
  role === "admin"
    ? <AdminForm onSuccess={onSuccess} />
    : <StudentForm onSuccess={onSuccess} />;

export default AuthForm;
