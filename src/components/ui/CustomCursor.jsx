import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const CustomCursor = () => {
  const location = useLocation();
  const useNativeCursor = false;
  const [cursorRoot, setCursorRoot] = useState(document.body);
  const [visible,  setVisible]  = useState(false);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pulses,   setPulses]   = useState([]);
  const [trails,   setTrails]   = useState([]);

  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  // Page-specific cursor modes
  const isSpecialPage = ['/dashboard', '/upload', '/interview', '/results'].includes(location.pathname);
  const pageMode = {
    '/dashboard': 'analytics',
    '/upload': 'upload', 
    '/interview': 'interview',
    '/results': 'results'
  }[location.pathname] || 'default';

  useEffect(() => {
    const onFullscreenChange = () => {
      setCursorRoot(document.fullscreenElement || document.body);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  /* Dot — tight spring, follows instantly */
  const dotX = useSpring(mouseX, { stiffness: 600, damping: 35, mass: 0.3 });
  const dotY = useSpring(mouseY, { stiffness: 600, damping: 35, mass: 0.3 });

  /* Ring — loose spring, lags behind for depth */
  const ringX = useSpring(mouseX, { stiffness: 120, damping: 18, mass: 0.6 });
  const ringY = useSpring(mouseY, { stiffness: 120, damping: 18, mass: 0.6 });

  /* Outer aura — even looser */
  const auraX = useSpring(mouseX, { stiffness: 55, damping: 14, mass: 1 });
  const auraY = useSpring(mouseY, { stiffness: 55, damping: 14, mass: 1 });

  const rafRef = useRef(null);
  const idRef  = useRef(0);
  const trailRef = useRef(0);

  // Page-specific colors and effects
  const getPageTheme = () => {
    switch (pageMode) {
      case 'analytics': return {
        primary: 'rgba(99,102,241,0.9)',
        secondary: 'rgba(6,182,212,0.7)',
        glow: 'rgba(99,102,241,0.5)',
        trail: 'rgba(99,102,241,0.3)'
      };
      case 'upload': return {
        primary: 'rgba(16,185,129,0.9)',
        secondary: 'rgba(34,197,94,0.7)', 
        glow: 'rgba(16,185,129,0.5)',
        trail: 'rgba(16,185,129,0.3)'
      };
      case 'interview': return {
        primary: 'rgba(139,92,246,0.9)',
        secondary: 'rgba(168,85,247,0.7)',
        glow: 'rgba(139,92,246,0.5)',
        trail: 'rgba(139,92,246,0.3)'
      };
      case 'results': return {
        primary: 'rgba(245,158,11,0.9)',
        secondary: 'rgba(251,191,36,0.7)',
        glow: 'rgba(245,158,11,0.5)',
        trail: 'rgba(245,158,11,0.3)'
      };
      default: return {
        primary: 'rgba(255,255,255,0.9)',
        secondary: 'rgba(255,255,255,0.7)',
        glow: 'rgba(255,255,255,0.5)',
        trail: 'rgba(255,255,255,0.3)'
      };
    }
  };

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
        setVisible(true);
        
        // Add trail effect for special pages
        if (isSpecialPage) {
          const trailId = ++trailRef.current;
          setTrails(t => [...t.slice(-8), { 
            id: trailId, 
            x: e.clientX, 
            y: e.clientY,
            timestamp: Date.now()
          }]);
          setTimeout(() => {
            setTrails(t => t.filter(x => x.id !== trailId));
          }, 800);
        }
      });
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);
    const onDown  = (e) => {
      setClicking(true);
      /* Spawn click pulse with page-specific effects */
      const id = ++idRef.current;
      setPulses(p => [...p, { id, x: e.clientX, y: e.clientY, mode: pageMode }]);
      setTimeout(() => setPulses(p => p.filter(x => x.id !== id)), 700);
    };
    const onUp = () => setClicking(false);

    const onOver = (e) => {
      const el = e.target;
      setHovering(!!el.closest("button, a, [role='button'], input, textarea, select, label"));
    };

    document.addEventListener("mousemove",  onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mousedown",  onDown);
    document.addEventListener("mouseup",    onUp);
    document.addEventListener("mouseover",  onOver);

    return () => {
      document.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mousedown",  onDown);
      document.removeEventListener("mouseup",    onUp);
      document.removeEventListener("mouseover",  onOver);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mouseX, mouseY, isSpecialPage, pageMode]);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;
  if (useNativeCursor) return null;

  const theme = getPageTheme();

  return createPortal(
    <>
      {/* ── Trail particles for special pages ── */}
      {isSpecialPage && (
        <AnimatePresence>
          {trails.map((trail, i) => (
            <motion.div
              key={trail.id}
              className="fixed top-0 left-0 rounded-full pointer-events-none"
              style={{
                left: trail.x,
                top: trail.y,
                translateX: "-50%",
                translateY: "-50%",
                width: 4 - i * 0.3,
                height: 4 - i * 0.3,
                background: theme.trail,
                zIndex: 9998 - i
              }}
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>
      )}

      {/* ── Outer aura (slowest, largest) ── */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none"
        style={{
          x: auraX, y: auraY,
          translateX: "-50%", translateY: "-50%",
          width: isSpecialPage ? 100 : 80, 
          height: isSpecialPage ? 100 : 80,
          opacity: visible ? 1 : 0,
          zIndex: 9999
        }}
        animate={{
          scale: hovering ? 1.4 : clicking ? 0.6 : 1,
          background: hovering
            ? `radial-gradient(circle, ${theme.primary}15 0%, transparent 70%)`
            : `radial-gradient(circle, ${theme.secondary}08 0%, transparent 70%)`,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* ── Ring (medium lag) ── */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border pointer-events-none"
        style={{
          x: ringX, y: ringY,
          translateX: "-50%", translateY: "-50%",
          width:  hovering ? (isSpecialPage ? 56 : 48) : (isSpecialPage ? 42 : 36),
          height: hovering ? (isSpecialPage ? 56 : 48) : (isSpecialPage ? 42 : 36),
          opacity: visible ? 1 : 0,
          zIndex: 10000
        }}
        animate={{
          scale: clicking ? 0.7 : 1,
          borderColor: hovering ? theme.primary : theme.secondary,
          boxShadow: hovering
            ? `0 0 25px ${theme.glow}, inset 0 0 15px ${theme.primary}20`
            : `0 0 12px ${theme.glow}`,
          backgroundColor: hovering ? `${theme.primary}10` : "transparent",
          rotate: isSpecialPage ? (hovering ? 180 : 0) : 0
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      />

      {/* ── Inner dot (instant) ── */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none"
        style={{
          x: dotX, y: dotY,
          translateX: "-50%", translateY: "-50%",
          width:  clicking ? 3 : hovering ? (isSpecialPage ? 9 : 7) : (isSpecialPage ? 6 : 5),
          height: clicking ? 3 : hovering ? (isSpecialPage ? 9 : 7) : (isSpecialPage ? 6 : 5),
          opacity: visible ? 1 : 0,
          zIndex: 10001
        }}
        animate={{
          backgroundColor: hovering ? theme.primary.replace('0.9', '1') : theme.secondary.replace('0.7', '1'),
          boxShadow: hovering
            ? `0 0 18px ${theme.primary}, 0 0 35px ${theme.glow}`
            : `0 0 12px ${theme.glow}`,
          scale: clicking ? 0.4 : (isSpecialPage && hovering ? 1.2 : 1),
        }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      />

      {/* ── Click pulse bursts ── */}
      <AnimatePresence>
        {pulses.map(p => {
          const pulseTheme = getPageTheme();
          return (
            <motion.div
              key={p.id}
              className="fixed top-0 left-0 rounded-full pointer-events-none border"
              style={{
                left: p.x, top: p.y,
                translateX: "-50%", translateY: "-50%",
                borderColor: pulseTheme.primary,
                zIndex: 9997
              }}
              initial={{ width: 8, height: 8, opacity: 0.9 }}
              animate={{ 
                width: isSpecialPage ? 120 : 80, 
                height: isSpecialPage ? 120 : 80, 
                opacity: 0,
                rotate: isSpecialPage ? 360 : 0
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </AnimatePresence>

      {/* ── Second pulse ring (themed, slightly delayed) ── */}
      <AnimatePresence>
        {pulses.map(p => {
          const pulseTheme = getPageTheme();
          return (
            <motion.div
              key={`c-${p.id}`}
              className="fixed top-0 left-0 rounded-full pointer-events-none border"
              style={{
                left: p.x, top: p.y,
                translateX: "-50%", translateY: "-50%",
                borderColor: pulseTheme.secondary,
                zIndex: 9996
              }}
              initial={{ width: 4, height: 4, opacity: 0.7 }}
              animate={{ 
                width: isSpecialPage ? 70 : 50, 
                height: isSpecialPage ? 70 : 50, 
                opacity: 0,
                rotate: isSpecialPage ? -180 : 0
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            />
          );
        })}
      </AnimatePresence>

      {/* ── Page-specific floating particles ── */}
      {isSpecialPage && (
        <AnimatePresence>
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="fixed top-0 left-0 rounded-full pointer-events-none"
              style={{
                x: auraX,
                y: auraY,
                translateX: "-50%",
                translateY: "-50%",
                width: 2,
                height: 2,
                background: theme.trail,
                zIndex: 9995
              }}
              animate={{
                x: [0, Math.cos(i * 120) * 30, 0],
                y: [0, Math.sin(i * 120) * 30, 0],
                opacity: visible ? [0.6, 0.2, 0.6] : 0,
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </AnimatePresence>
      )}
    </>
  , cursorRoot);
};

export default CustomCursor;
