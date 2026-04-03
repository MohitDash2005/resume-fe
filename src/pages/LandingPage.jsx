import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, BarChart2, Shield, ArrowRight, Star, TrendingUp, Users, FileText, ChevronRight, Sparkles, Brain, Target, Award } from "lucide-react";
// ChevronRight still used in feature cards
import { getPublicStats } from "../api/resumeApi";
import AnimatedBackground from "../components/ui/AnimatedBackground";



/* ── Typewriter headline ── */
const WORDS = ["Dream Job", "Next Role", "Career Goal", "Promotion"];
const Typewriter = () => {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = WORDS[idx];
    let timeout;
    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx(i => (i + 1) % WORDS.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, idx]);
  return (
    <span className="gradient-text">
      {displayed}<span className="animate-pulse">|</span>
    </span>
  );
};

/* ── Animated counter ── */
const Counter = ({ target, suffix = "", duration = 2000 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = null, raf;
        const step = (ts) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        observer.disconnect();
        return () => cancelAnimationFrame(raf);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

const FEATURES = [
  {
    icon: BarChart2, color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)",
    title: "AI Resume Scoring", desc: "Get instant ATS compatibility scores, keyword analysis, and format evaluation powered by GPT-4.",
    badge: "Most Popular",
  },
  {
    icon: Target, color: "#06b6d4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)",
    title: "Skill Gap Analysis", desc: "Identify exactly which skills are missing from your resume compared to your target role.",
    badge: "AI Powered",
  },
  {
    icon: Brain, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)",
    title: "Mock Interviews", desc: "Practice with an AI interviewer that adapts questions based on your answers in real-time.",
    badge: "Interactive",
  },
  {
    icon: Shield, color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)",
    title: "ATS Optimization", desc: "Ensure your resume passes Applicant Tracking Systems with targeted keyword suggestions.",
    badge: "Smart",
  },
];

const STEPS = [
  { num: "01", title: "Upload Resume", desc: "Drop your PDF or DOCX file. Our AI parses it instantly.", icon: FileText, color: "#6366f1" },
  { num: "02", title: "AI Analysis",   desc: "GPT-4 scores your resume across 4 dimensions in seconds.", icon: Zap,      color: "#06b6d4" },
  { num: "03", title: "Get Results",   desc: "View your score, skill gaps, and actionable suggestions.", icon: Award,    color: "#8b5cf6" },
];

const stagger = { animate: { transition: { staggerChildren: 0.1 } } };
const fadeUp  = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16,1,.3,1] } } };

const LandingPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    getPublicStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#02020a] overflow-x-hidden">
      <AnimatedBackground>

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 md:px-12 h-16"
        style={{ background: "transparent" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">
            <span className="text-cyan-400">Smart</span>{" "}
            <span className="text-violet-400">Resume</span>{" "}
            <span className="text-emerald-400">Analyzer</span>
          </span>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">

        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center px-6 max-w-5xl mx-auto">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>
            <Sparkles size={12} />
            Powered by GPT-4 · Trusted by professionals
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16,1,.3,1] }}
            className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Land Your<br />
            <Typewriter />
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            AI-powered resume analysis, skill gap detection, and mock interview coaching — everything you need to stand out.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex items-center justify-center mb-16">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 48px rgba(99,102,241,0.55)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/login")}
              className="btn-primary px-8 py-4 text-base font-bold flex items-center gap-3 rounded-2xl">
              <Sparkles size={18} />
              Analyze My Resume Free
              <ArrowRight size={16} />
            </motion.button>
          </motion.div>

          {/* Live stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: Users,     label: "Professionals",    val: stats?.totalUsers    || 1200, suffix: "+" },
              { icon: FileText,  label: "Resumes Analyzed", val: stats?.totalResumes  || 3400, suffix: "+" },
              { icon: TrendingUp,label: "Avg Score Boost",  val: 34,                           suffix: "%" },
              { icon: Star,      label: "Satisfaction",     val: 98,                           suffix: "%" },
            ].map(({ icon: Icon, label, val, suffix }) => (
              <div key={label} className="stat-pill">
                <Icon size={13} className="text-primary-400" />
                <span className="text-white font-bold tabular-nums">
                  <Counter target={val} suffix={suffix} />
                </span>
                <span className="text-slate-600">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16">
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#22d3ee" }}>
              <Zap size={11} /> Everything you need
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white mb-4">
              Built for serious<br /><span className="gradient-text">job seekers</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 text-lg max-w-xl mx-auto">
              Every feature is designed to give you a real competitive edge in your job search.
            </motion.p>
          </motion.div>

          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, color, bg, border, title, desc, badge }) => (
              <motion.div key={title} variants={fadeUp}
                whileHover={{ y: -4, borderColor: border }}
                className="feature-card group"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 0 20px ${color}20` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: bg, color, border: `1px solid ${border}` }}>
                    {badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1.5 mt-5 text-xs font-semibold transition-all duration-200"
                  style={{ color }}>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">Learn more</span>
                  <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transition-transform duration-200" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div className="max-w-4xl mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}
            className="text-center mb-16">
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
              <Target size={11} /> Simple process
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white mb-4">
              From upload to<br /><span className="gradient-text">offer letter</span>
            </motion.h2>
          </motion.div>

          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}
            className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }} />

            {STEPS.map(({ num, title, desc, icon: Icon, color }, i) => (
              <motion.div key={num} variants={fadeUp}
                className="relative flex flex-col items-center text-center p-6 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative"
                  style={{ background: `${color}15`, border: `1px solid ${color}30`, boxShadow: `0 0 24px ${color}20` }}>
                  <Icon size={24} style={{ color }} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: color, boxShadow: `0 0 12px ${color}60` }}>
                    {i + 1}
                  </span>
                </div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color }}>{num}</p>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16,1,.3,1] }}
            className="relative overflow-hidden rounded-3xl p-12 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(6,182,212,0.15) 50%, rgba(139,92,246,0.15) 100%)",
              border: "1px solid rgba(99,102,241,0.25)",
              boxShadow: "0 0 80px rgba(99,102,241,0.12)",
            }}>
            <div className="absolute inset-0 dot-grid opacity-30" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)", boxShadow: "0 0 32px rgba(99,102,241,0.5)" }}>
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Ready to land your<br /><span className="gradient-text-hero">dream job?</span>
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Join thousands of professionals who improved their resume score and landed interviews faster.
              </p>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 48px rgba(99,102,241,0.6)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/login")}
                className="btn-primary px-10 py-4 text-base font-bold rounded-2xl inline-flex items-center gap-3">
                <Sparkles size={18} />
                Start For Free
                <ArrowRight size={16} />
              </motion.button>
              <p className="text-slate-600 text-xs mt-4">No credit card required · Free forever</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-8 px-6 text-center" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)" }}>
            <Zap size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold">
            <span className="text-cyan-400">Smart</span>{" "}
            <span className="text-violet-400">Resume</span>{" "}
            <span className="text-emerald-400">Analyzer</span>
          </span>
        </div>
        <p className="text-slate-700 text-xs">© 2025 Smart Resume Analyzer · Built with ❤️</p>
      </footer>
      </AnimatedBackground>
    </div>
  );
};

export default LandingPage;
