import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { ToastProvider } from "./components/ui/Toast";
import CustomCursor from "./components/ui/CustomCursor";
import AppLayout from "./components/layout/AppLayout";
import LandingPage    from "./pages/LandingPage";
import LoginPage      from "./pages/LoginPage";
import Dashboard      from "./pages/Dashboard";
import UploadPage     from "./pages/UploadPage";
import ResultPage     from "./pages/ResultPage";
import InterviewPage  from "./pages/InterviewPage";
import HistoryPage    from "./pages/HistoryPage";
import OAuthCallback  from "./pages/OAuthCallback";
import AdminLayout    from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers     from "./pages/admin/AdminUsers";
import AdminResumes   from "./pages/admin/AdminResumes";
import AdminInterviews from "./pages/admin/AdminInterviews";
import AdminSkills    from "./pages/admin/AdminSkills";
import AdminFeedback  from "./pages/admin/AdminFeedback";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#02020a]">
    <div className="flex flex-col items-center gap-4">
      <span className="w-8 h-8 border-2 border-white/10 border-t-primary-500 rounded-full animate-spin" />
      <p className="text-slate-600 text-xs">Loading...</p>
    </div>
  </div>
);

const AdminRoute = ({ children }) => {
  const { user, authLoading } = useApp();
  if (authLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminPanel = () => {
  const [active, setActive] = useState("dashboard");
  const pages = {
    dashboard:  <AdminDashboard />,
    users:      <AdminUsers />,
    resumes:    <AdminResumes />,
    interviews: <AdminInterviews />,
    skills:     <AdminSkills />,
    feedback:   <AdminFeedback />,
  };
  return (
    <AdminRoute>
      <AdminLayout active={active} setActive={setActive}>
        {pages[active]}
      </AdminLayout>
    </AdminRoute>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useApp();
  if (authLoading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user, authLoading } = useApp();
  if (authLoading) return <Spinner />;
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          user ? <Navigate to={user.isAdmin ? "/admin" : "/dashboard"} replace /> : <LoginPage />
        } />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute><AppLayout><UploadPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute><AppLayout><ResultPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/interview" element={
          <ProtectedRoute><AppLayout><InterviewPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <AppProvider>
    <ToastProvider>
      <BrowserRouter>
        <CustomCursor />
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  </AppProvider>
);

export default App;
