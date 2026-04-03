import { useState, useEffect, useRef } from "react";
import { Bell, Search, X, Menu, User, Lock, LogOut, ChevronRight, Check, Eye, EyeOff, Sparkles, Phone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useToast } from "../ui/Toast";
import { updateProfile, updateContact, changePassword } from "../../api/resumeApi";

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="hidden lg:block text-xs text-slate-700 font-mono tabular-nums">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
};

const ProfileModal = ({ user, onClose, onUserUpdate }) => {
  const [tab, setTab]           = useState("profile");
  const [name, setName]         = useState(user?.name || "");
  const [email, setEmail]       = useState(user?.email || "");
  const [phone, setPhone]       = useState(user?.phone || "");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [curPass, setCurPass]   = useState("");
  const [newPass, setNewPass]   = useState("");
  const [showCur, setShowCur]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved]   = useState(false);
  const [pwError, setPwError]   = useState("");
  const isOAuth = !!(user?.googleId || user?.githubId);
  const toast = useToast();

  // What the user registered with
  const hasEmail = !!user?.email;
  const hasPhone = !!user?.phone;

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      // Save name
      let updated = await updateProfile({ name });

      // Save contact changes if any
      const contactPayload = {};
      if (email.trim() && email !== user?.email) contactPayload.email = email.trim();
      if (phone.trim() && phone !== user?.phone) contactPayload.phone = phone.trim();
      if (Object.keys(contactPayload).length > 0) {
        updated = await updateContact(contactPayload);
      }

      onUserUpdate(updated);
      setSaved(true);
      toast.success("Profile updated", "Your changes have been saved.");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update profile";
      setError(msg); toast.error("Update failed", msg);
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!curPass || !newPass) { setPwError("Both fields are required"); return; }
    if (newPass.length < 6)   { setPwError("Minimum 6 characters"); return; }
    setPwSaving(true); setPwError("");
    try {
      await changePassword({ currentPassword: curPass, newPassword: newPass });
      setPwSaved(true); setCurPass(""); setNewPass("");
      toast.success("Password changed", "Your password has been updated.");
      setTimeout(() => setPwSaved(false), 2000);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to change password";
      setPwError(msg); toast.error("Password change failed", msg);
    } finally { setPwSaving(false); }
  };

  // Display identifier in the banner (prefer email, fallback to phone)
  const displayIdentifier = hasEmail ? user.email : hasPhone ? user.phone : "—";
  const identifierIcon    = hasEmail ? <Mail size={11} className="inline mr-1" /> : <Phone size={11} className="inline mr-1" />;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 16 }}
        transition={{ ease: [0.16,1,.3,1], duration: 0.28 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "rgba(6,6,16,0.99)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-bold text-white">Account Settings</h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* User banner */}
        <div className="flex items-center gap-4 px-6 py-4"
          style={{ background: "rgba(99,102,241,0.05)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0 overflow-hidden"
            style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-xl object-cover" />
              : user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
              {identifierIcon}{displayIdentifier}
            </p>
            {hasEmail && hasPhone && (
              <p className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                <Phone size={9} /> {user.phone}
              </p>
            )}
            {isOAuth && (
              <span className="text-[10px] text-primary-400 font-semibold">
                {user?.googleId ? "🌐 Google account" : "🐙 GitHub account"}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-4 mt-4 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {[{ id: "profile", icon: User, label: "Profile" }, { id: "password", icon: Lock, label: "Password" }].map(({ id, icon: Icon, label }) => (
            <button key={id}
              onClick={() => { setTab(id); setError(""); setPwError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === id ? "text-white" : "text-slate-600 hover:text-slate-400"}`}
              style={tab === id ? {
                background: "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(6,182,212,0.15))",
                border: "1px solid rgba(99,102,241,0.2)",
              } : {}}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">
          <AnimatePresence mode="wait">
            {tab === "profile" && (
              <motion.div key="profile"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }} className="space-y-4">

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Your name" />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
                    <Mail size={10} /> Email Address
                    {!hasEmail && <span className="text-primary-400 normal-case font-normal">(not set)</span>}
                  </label>
                  <input
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    className="input-field"
                    placeholder={hasEmail ? user.email : "Add your email address"}
                    type="email"
                    disabled={isOAuth}
                  />
                  {isOAuth && <p className="text-[10px] text-slate-700">Managed by your OAuth provider</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
                    <Phone size={10} /> Phone Number
                    {!hasPhone && <span className="text-primary-400 normal-case font-normal">(not set)</span>}
                  </label>
                  <input
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setError(""); }}
                    className="input-field"
                    placeholder={hasPhone ? user.phone : "Add your phone number"}
                    type="tel"
                  />
                </div>

                {error && <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <button onClick={handleSaveProfile} disabled={saving || !name.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 btn-primary">
                  {saving
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : saved ? <><Check size={14} /> Saved!</> : "Save Changes"}
                </button>
              </motion.div>
            )}
            {tab === "password" && (
              <motion.div key="password"
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }} className="space-y-4">
                {isOAuth ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-sm">Password change not available for OAuth accounts.</p>
                  </div>
                ) : (
                  <>
                    {[
                      { label: "Current Password", val: curPass, set: setCurPass, show: showCur, toggle: () => setShowCur(s => !s) },
                      { label: "New Password",     val: newPass, set: setNewPass, show: showNew, toggle: () => setShowNew(s => !s) },
                    ].map(({ label, val, set, show, toggle }) => (
                      <div key={label} className="space-y-1.5">
                        <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">{label}</label>
                        <div className="relative">
                          <input type={show ? "text" : "password"} value={val}
                            onChange={e => set(e.target.value)} className="input-field pr-10" placeholder="••••••••" />
                          <button type="button" onClick={toggle}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                            {show ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {pwError && <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{pwError}</p>}
                    <button onClick={handleChangePassword} disabled={pwSaving}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 btn-primary">
                      {pwSaving
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : pwSaved ? <><Check size={14} /> Changed!</> : "Change Password"}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Navbar = ({ title, user, onMenuClick }) => {
  const { logout, setUser } = useApp();
  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [searching,   setSearching]   = useState(false);
  const notifRef   = useRef();
  const profileRef = useRef();
  const searchRef  = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearching(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === "Escape") { setSearching(false); setShowModal(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="h-14 flex items-center justify-between px-5 sticky top-0 z-30"
        style={{
          background: "rgba(2,2,10,0.92)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <Menu size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#06b6d4", boxShadow: "0 0 8px rgba(6,182,212,0.9)" }} />
            <h1 className="text-sm font-bold text-white">{title}</h1>
          </div>
          <LiveClock />
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <AnimatePresence mode="wait">
            {searching ? (
              <motion.div key="open"
                initial={{ width: 40, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 40, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16,1,.3,1] }}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                style={{
                  background: "rgba(6,6,16,0.95)",
                  border: "1px solid rgba(99,102,241,0.35)",
                  boxShadow: "0 0 20px rgba(99,102,241,0.12)",
                }}>
                <Search size={13} className="text-primary-400 flex-shrink-0" />
                <input ref={searchRef} autoFocus placeholder="Search anything..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none" />
                <button onClick={() => setSearching(false)} className="text-slate-600 hover:text-white transition-colors">
                  <X size={13} />
                </button>
              </motion.div>
            ) : (
              <motion.button key="closed"
                onClick={() => { setSearching(true); setTimeout(() => searchRef.current?.focus(), 50); }}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-400 transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Search size={13} /><span>Search</span>
                <kbd className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-mono"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>⌘K</kbd>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Bell */}
          <div className="relative" ref={notifRef}>
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowNotif(s => !s)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{
                background: showNotif ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
              <Bell size={15} className={showNotif ? "text-primary-400" : "text-slate-500"} />
            </motion.button>
            <AnimatePresence>
              {showNotif && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-11 w-64 rounded-2xl overflow-hidden z-50"
                  style={{ background: "rgba(6,6,16,0.99)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs font-bold text-white">Notifications</p>
                  </div>
                  <div className="px-4 py-6 text-center">
                    <Sparkles size={20} className="text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">No notifications yet.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <div className="relative" ref={profileRef}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfile(s => !s)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white cursor-pointer overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
                boxShadow: "0 0 16px rgba(99,102,241,0.4)",
              }}>
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : user?.name?.[0]?.toUpperCase() || "U"}
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16,1,.3,1] }}
                  className="absolute right-0 top-11 w-56 rounded-2xl overflow-hidden z-50"
                  style={{ background: "rgba(6,6,16,0.99)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-600 truncate">
                      {user?.email || user?.phone || ""}
                    </p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    {[
                      { icon: User,  label: "Edit Profile",     color: "text-primary-400" },
                      { icon: Lock,  label: "Change Password",  color: "text-amber-400" },
                    ].map(({ icon: Icon, label, color }) => (
                      <button key={label}
                        onClick={() => { setShowProfile(false); setShowModal(true); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all group">
                        <Icon size={13} className={color} />
                        <span className="flex-1 text-left">{label}</span>
                        <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                  <div className="p-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <button
                      onClick={() => { setShowProfile(false); logout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                      <LogOut size={13} /><span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showModal && (
          <ProfileModal
            user={user}
            onClose={() => setShowModal(false)}
            onUserUpdate={(updated) => { setUser(updated); }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
