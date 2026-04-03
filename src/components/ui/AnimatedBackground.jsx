import { useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   UTILITY
═══════════════════════════════════════════════════════════ */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isMobile = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches ||
   window.innerWidth < 768);

/* ═══════════════════════════════════════════════════════════
   LAYER 1 — AURORA CANVAS
   Simplex-style noise aurora using layered sin/cos waves.
   Runs on its own canvas, blended with "screen" mix-mode.
═══════════════════════════════════════════════════════════ */
const AuroraCanvas = () => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W, H, raf;
    let t = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* Pseudo-noise: layered sin waves give organic aurora feel */
    const noise = (x, y, t) =>
      Math.sin(x * 0.003 + t * 0.4) *
      Math.cos(y * 0.004 + t * 0.3) +
      Math.sin(x * 0.007 - t * 0.2) *
      Math.sin(y * 0.006 + t * 0.5) * 0.5;

    /* Aurora bands — each has a colour stop and vertical position */
    const BANDS = [
      { cy: 0.25, spread: 0.28, r: 79,  g: 70,  b: 229, a: 0.22 }, // indigo
      { cy: 0.45, spread: 0.22, r: 99,  g: 102, b: 241, a: 0.18 }, // violet
      { cy: 0.60, spread: 0.20, r: 6,   g: 182, b: 212, a: 0.14 }, // cyan
      { cy: 0.35, spread: 0.18, r: 139, g: 92,  b: 246, a: 0.12 }, // purple
    ];

    const draw = () => {
      t += 0.004;
      ctx.clearRect(0, 0, W, H);

      BANDS.forEach(band => {
        /* Warp the vertical centre with noise */
        const warpedCY = band.cy + noise(W * 0.5, H * band.cy, t) * 0.08;
        const cy = warpedCY * H;
        const spread = band.spread * H;

        const grad = ctx.createRadialGradient(
          W * 0.5 + Math.sin(t * 0.7) * W * 0.15,
          cy + Math.cos(t * 0.5) * spread * 0.3,
          0,
          W * 0.5,
          cy,
          W * 0.65
        );

        const alpha = band.a + Math.sin(t * 1.2 + band.cy * 10) * 0.04;
        grad.addColorStop(0,   `rgba(${band.r},${band.g},${band.b},${clamp(alpha, 0, 0.35)})`);
        grad.addColorStop(0.4, `rgba(${band.r},${band.g},${band.b},${clamp(alpha * 0.4, 0, 0.15)})`);
        grad.addColorStop(1,   `rgba(${band.r},${band.g},${band.b},0)`);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: "screen", opacity: 0.9 }}
    />
  );
};

/* ═══════════════════════════════════════════════════════════
   LAYER 2 — INTERACTIVE PARTICLE FIELD
   Particles drift, repel from cursor, connect with lines.
   Physics: velocity + damping + cursor force field.
═══════════════════════════════════════════════════════════ */
const ParticleField = () => {
  const ref    = useRef(null);
  const mouse  = useRef({ x: -9999, y: -9999 });
  const clicks = useRef([]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const mobile = isMobile();
    const COUNT  = mobile ? 45 : 110;
    const CONNECT_DIST = mobile ? 80 : 130;
    const REPEL_DIST   = mobile ? 80 : 120;
    const REPEL_FORCE  = mobile ? 0.6 : 1.0;

    let W, H, raf;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* Particle factory */
    const mkParticle = () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.4 + 0.4,
      baseAlpha: Math.random() * 0.45 + 0.1,
      phase: Math.random() * Math.PI * 2,
      /* colour: 80% indigo-white, 20% cyan */
      cyan: Math.random() > 0.8,
    });

    const particles = Array.from({ length: COUNT }, mkParticle);

    /* Click ripple */
    const onDown = (e) => {
      clicks.current.push({
        x: e.clientX, y: e.clientY,
        r: 0, alpha: 0.6, born: performance.now(),
      });
    };
    window.addEventListener("mousedown", onDown);

    /* Mouse tracking */
    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let t = 0;

    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, W, H);

      /* ── Update + draw particles ── */
      particles.forEach(p => {
        /* Cursor repulsion */
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_DIST && dist > 0) {
          const force = (REPEL_DIST - dist) / REPEL_DIST;
          p.vx += (dx / dist) * force * REPEL_FORCE * 0.08;
          p.vy += (dy / dist) * force * REPEL_FORCE * 0.08;
        }

        /* Damping + drift */
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x  += p.vx;
        p.y  += p.vy;

        /* Wrap edges */
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        /* Twinkle */
        const alpha = p.baseAlpha + Math.sin(t + p.phase) * 0.12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.cyan
          ? `rgba(6,182,212,${clamp(alpha, 0, 0.7)})`
          : `rgba(180,170,255,${clamp(alpha, 0, 0.7)})`;
        ctx.fill();
      });

      /* ── Connection lines ── */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(130,120,255,${alpha})`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }

      /* ── Click ripples ── */
      const now = performance.now();
      clicks.current = clicks.current.filter(c => {
        const age = (now - c.born) / 1000;
        if (age > 1.2) return false;
        const progress = age / 1.2;
        const r = progress * 120;
        const a = c.alpha * (1 - progress);

        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(99,102,241,${a})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        /* Inner pulse */
        ctx.beginPath();
        ctx.arc(c.x, c.y, r * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6,182,212,${a * 0.6})`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();

        return true;
      });

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="absolute inset-0 pointer-events-none"
    />
  );
};

/* ═══════════════════════════════════════════════════════════
   LAYER 3 — ENERGY WAVE LINES
   Diagonal flowing lines that look like data / AI energy.
   Pure canvas, very subtle.
═══════════════════════════════════════════════════════════ */
const EnergyWaves = () => {
  const ref = useRef(null);

  useEffect(() => {
    if (isMobile()) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W, H, raf, t = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* 6 wave lines, each with phase offset */
    const WAVES = Array.from({ length: 6 }, (_, i) => ({
      phase:  (i / 6) * Math.PI * 2,
      speed:  0.3 + i * 0.07,
      amp:    18 + i * 6,
      yBase:  0.15 + i * 0.13,
      alpha:  0.04 + (i % 3) * 0.015,
      color:  i % 2 === 0 ? "99,102,241" : "6,182,212",
    }));

    const draw = () => {
      t += 0.006;
      ctx.clearRect(0, 0, W, H);

      WAVES.forEach(w => {
        const yBase = w.yBase * H;
        ctx.beginPath();

        for (let x = 0; x <= W; x += 3) {
          const y = yBase
            + Math.sin(x * 0.006 + t * w.speed + w.phase) * w.amp
            + Math.cos(x * 0.003 - t * w.speed * 0.7) * (w.amp * 0.4);

          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(${w.color},${w.alpha})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="absolute inset-0 pointer-events-none"
    />
  );
};

/* ═══════════════════════════════════════════════════════════
   LAYER 4 — CURSOR ENERGY TRAIL
   Glowing orb + fading trail particles following cursor.
   Separate from CustomCursor (background layer only).
═══════════════════════════════════════════════════════════ */
const CursorGlow = () => {
  const ref   = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  const trail = useRef([]);
  const cur   = useRef({ x: -999, y: -999 });

  useEffect(() => {
    if (isMobile()) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W, H, raf;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      /* Spawn trail particle */
      trail.current.push({
        x: e.clientX, y: e.clientY,
        alpha: 0.5,
        r: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
      });
      if (trail.current.length > 28) trail.current.shift();
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      /* Lerp main glow toward cursor */
      cur.current.x = lerp(cur.current.x, mouse.current.x, 0.1);
      cur.current.y = lerp(cur.current.y, mouse.current.y, 0.1);

      /* Main cursor glow */
      const g = ctx.createRadialGradient(
        cur.current.x, cur.current.y, 0,
        cur.current.x, cur.current.y, 180
      );
      g.addColorStop(0,   "rgba(99,102,241,0.18)");
      g.addColorStop(0.3, "rgba(6,182,212,0.08)");
      g.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      /* Trail particles */
      trail.current.forEach((p, i) => {
        p.alpha *= 0.88;
        p.x += p.vx;
        p.y += p.vy;
        p.r  *= 0.97;

        if (p.alpha < 0.01) return;

        const frac = i / trail.current.length;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = frac > 0.6
          ? `rgba(6,182,212,${p.alpha})`
          : `rgba(139,92,246,${p.alpha})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

/* ═══════════════════════════════════════════════════════════
   LAYER 5 — 3D PARALLAX WRAPPER
   Mouse position drives subtle layer shifts via CSS transform.
   Children receive depth via data-depth attribute.
═══════════════════════════════════════════════════════════ */
const ParallaxLayer = ({ children, depth = 1, className = "" }) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  const x = useTransform(sx, v => v * depth);
  const y = useTransform(sy, v => v * depth);

  useEffect(() => {
    if (isMobile()) return;
    const onMove = (e) => {
      const cx = (e.clientX / window.innerWidth  - 0.5) * 24;
      const cy = (e.clientY / window.innerHeight - 0.5) * 16;
      mx.set(cx);
      my.set(cy);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   LAYER 6 — DOT GRID (tech overlay, pure CSS)
═══════════════════════════════════════════════════════════ */
const DotGrid = () => (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
      backgroundSize: "28px 28px",
    }}
  />
);

/* ═══════════════════════════════════════════════════════════
   PAGE LOAD ANIMATION
   Dark → gradient reveal on mount.
═══════════════════════════════════════════════════════════ */
const PageLoadVeil = () => (
  <motion.div
    aria-hidden
    className="absolute inset-0 pointer-events-none z-20"
    style={{ background: "#02020a" }}
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
  />
);

/* ═══════════════════════════════════════════════════════════
   COMPOSED — AnimatedBackground (drop-in replacement)
   Usage:  <AnimatedBackground> ...page content... </AnimatedBackground>
═══════════════════════════════════════════════════════════ */
const AnimatedBackground = ({ children }) => (
  <div
    className="relative overflow-x-hidden"
    style={{ background: "#02020a", isolation: "isolate" }}
  >
    {/* ── Background layers (z-0) ── */}
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <AuroraCanvas />
      <EnergyWaves />
      <ParticleField />
      <CursorGlow />
      <DotGrid />
    </div>

    {/* ── Page-load veil ── */}
    <PageLoadVeil />

    {/* ── Content with parallax depth ── */}
    <ParallaxLayer depth={0.4} className="relative" style={{ zIndex: 10 }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
      >
        {children}
      </motion.div>
    </ParallaxLayer>
  </div>
);

export default AnimatedBackground;
export { ParallaxLayer, CursorGlow };
