/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        primary: {
          50:  "#ecfeff", 100: "#cffafe", 200: "#a5f3fc",
          300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4",
          600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63",
        },
        accent: {
          400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed",
        },
        surface: {
          DEFAULT: "#02020a",
          50:  "#06060f",
          100: "#0c0c1e",
          200: "#111827",
          300: "#1e293b",
          400: "#334155",
          border: "rgba(255,255,255,0.06)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient":   "linear-gradient(135deg, #02020a 0%, #06060f 50%, #02020a 100%)",
        "card-gradient":   "linear-gradient(145deg, rgba(12,12,26,0.92), rgba(6,6,16,0.96))",
        "cyan-gradient":   "linear-gradient(135deg, #0891b2, #06b6d4)",
        "violet-gradient": "linear-gradient(135deg, #7c3aed, #8b5cf6)",
        "indigo-gradient": "linear-gradient(135deg, #4f46e5, #6366f1)",
      },
      boxShadow: {
        "glow-cyan":   "0 0 24px rgba(6,182,212,0.35)",
        "glow-violet": "0 0 24px rgba(139,92,246,0.35)",
        "glow-indigo": "0 0 24px rgba(99,102,241,0.35)",
        "glow-green":  "0 0 24px rgba(16,185,129,0.35)",
        "glow-amber":  "0 0 24px rgba(245,158,11,0.35)",
        "card":        "0 4px 24px rgba(0,0,0,0.5)",
        "card-hover":  "0 16px 48px rgba(0,0,0,0.6)",
        "inner":       "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      animation: {
        "fade-in":    "fadeIn .4s ease both",
        "slide-up":   "slideUp .45s cubic-bezier(.16,1,.3,1) both",
        "shimmer":    "shimmer 1.8s linear infinite",
        "float":      "float 4s ease-in-out infinite",
        "float-slow": "float 7s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(.4,0,.6,1) infinite",
        "wave":       "wave 1.4s ease-in-out infinite",
        "orbit":      "orbit 6s linear infinite",
        "spin-slow":  "spin 8s linear infinite",
        "gradient-x": "gradientShift 7s ease infinite",
      },
      keyframes: {
        fadeIn:       { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:      { from: { opacity: 0, transform: "translateY(24px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        shimmer:      { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        float:        { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-12px)" } },
        wave:         { "0%,100%": { transform: "scaleY(0.3)" }, "50%": { transform: "scaleY(1)" } },
        orbit:        { from: { transform: "rotate(0deg) translateX(28px) rotate(0deg)" }, to: { transform: "rotate(360deg) translateX(28px) rotate(-360deg)" } },
        gradientShift:{ "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
      },
      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
};
