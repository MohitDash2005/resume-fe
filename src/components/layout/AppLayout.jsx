import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useApp } from "../../context/AppContext";
import DashboardBackground from "../ui/DashboardBackground";
import FeedbackModal from "../ui/FeedbackModal";

const titles = {
  "/dashboard": "Dashboard",
  "/upload":    "Upload Resume",
  "/results":   "Analysis Results",
  "/interview": "AI Interview",
  "/history":   "Resume History",
};

const AppLayout = ({ children }) => {
  const { user, logout } = useApp();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#02020a]" style={{ position: "relative" }}>
      <DashboardBackground />
      {/* Desktop sidebar */}
      <div className="hidden md:block" style={{ position: "relative", zIndex: 1 }}>
        <Sidebar onLogout={logout} onFeedback={() => setShowFeedback(true)} />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 md:hidden"
              style={{ backdropFilter: "blur(6px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 h-full z-50 md:hidden"
            >
              <Sidebar onLogout={() => { logout(); setMobileOpen(false); }} onFeedback={() => { setShowFeedback(true); setMobileOpen(false); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      </AnimatePresence>

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen" style={{ position: "relative", zIndex: 1 }}>
        <Navbar
          title={titles[pathname] || "Smart Resume Analyzer"}
          user={user}
          onMenuClick={() => setMobileOpen(o => !o)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16,1,.3,1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
