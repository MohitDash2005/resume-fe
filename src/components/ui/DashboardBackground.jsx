import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const isMobile = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);

/* ── Data flow lines + depth grid ── */
const DataCanvas = () => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, raf, t = 0;

    const mobile = isMobile();

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* Horizontal data-stream lines */
    const LINE_COUNT = mobile ? 6 : 12;
    const lines = Array.from({ length: LINE_COUNT }, (_, i) => ({
      y:      (i / LINE_COUNT) * H + Math.random() * (H / LINE_COUNT),
      speed:  0.18 + Math.random() * 0.22,
      length: 60  + Math.random() * 140,
      offset: Math.random() * W,
      alpha:  0.04 + Math.random() * 0.04,
      color:  i % 3 === 0 ? "6,182,212" : i % 3 === 1 ? "99,102,241" : "139,92,246",
    }));

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, W, H);

      /* Dot grid — drawn once per frame at very low opacity */
      ctx.fillStyle = "rgba(255,255,255,0.018)";
      const GRID = 28;
      for (let x = GRID / 2; x < W; x += GRID) {
        for (let y = GRID / 2; y < H; y += GRID) {
          ctx.beginPath();
          ctx.arc(x, y, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* Data flow lines */
      lines.forEach(l => {
        const x = ((l.offset + t * l.speed) % (W + l.length)) - l.length;
        const grad = ctx.createLinearGradient(x, 0, x + l.length, 0);
        grad.addColorStop(0,   `rgba(${l.color},0)`);
        grad.addColorStop(0.4, `rgba(${l.color},${l.alpha})`);
        grad.addColorStop(1,   `rgba(${l.color},0)`);
        ctx.beginPath();
        ctx.moveTo(x, l.y);
        ctx.lineTo(x + l.length, l.y);
        ctx.strokeStyle = grad;
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

/* ── Cursor reactive spotlight ── */
const CursorSpotlight = () => {
  const mx = useMotionValue(-999);
  const my = useMotionValue(-999);
  const x  = useSpring(mx, { stiffness: 55, damping: 22 });
  const y  = useSpring(my, { stiffness: 55, damping: 22 });

  useEffect(() => {
    if (isMobile()) return;
    const onMove = (e) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  if (isMobile()) return null;

  return (
    <motion.div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        x, y,
        translateX: "-50%",
        translateY: "-50%",
        width:  420,
        height: 420,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)",
      }}
    />
  );
};

/* ── Ambient gradient orbs ── */
const AmbientOrbs = () => (
  <>
    {/* Top-left — blue/indigo */}
    <motion.div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        top: "-10%", left: "-8%",
        width: "55vw", height: "55vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(79,70,229,0.13) 0%, rgba(99,102,241,0.06) 50%, transparent 70%)",
        filter: "blur(60px)",
      }}
      animate={{
        x: [0, 28, -14, 0],
        y: [0, -18, 22, 0],
        scale: [1, 1.06, 0.97, 1],
      }}
      transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Bottom-right — cyan */}
    <motion.div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        bottom: "-12%", right: "-6%",
        width: "50vw", height: "50vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.10) 0%, rgba(6,182,212,0.04) 50%, transparent 70%)",
        filter: "blur(70px)",
      }}
      animate={{
        x: [0, -22, 16, 0],
        y: [0, 20, -16, 0],
        scale: [1, 0.95, 1.05, 1],
      }}
      transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: 4 }}
    />

    {/* Center — purple accent */}
    <motion.div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        top: "35%", left: "40%",
        width: "38vw", height: "38vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)",
        filter: "blur(80px)",
      }}
      animate={{
        x: [0, 18, -12, 0],
        y: [0, -14, 10, 0],
        scale: [1, 1.04, 0.98, 1],
      }}
      transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 8 }}
    />
  </>
);

/* ── Noise texture overlay ── */
const NoiseOverlay = () => (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none"
    style={{
      opacity: 0.022,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "180px 180px",
    }}
  />
);

/* ══════════════════════════════════════════
   DashboardBackground — drop into AppLayout
══════════════════════════════════════════ */
const DashboardBackground = () => (
  <div
    aria-hidden
    className="fixed inset-0 pointer-events-none overflow-hidden"
    style={{ zIndex: 0 }}
  >
    <AmbientOrbs />
    <DataCanvas />
    <NoiseOverlay />
    <CursorSpotlight />
  </div>
);

export default DashboardBackground;
