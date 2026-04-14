/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight:   "-0.02em",
      },

      // ── Colour tokens ──────────────────────────────────────────────────────
      colors: {
        brand: {
          50:  "#edfaeb",
          100: "#d3f5cc",
          200: "#a8eb9f",
          300: "#6dd966",
          400: "#3ec436",
          500: "#27a81b",
          600: "#1c660c",   // ← primary (#1C660C)
          700: "#155209",
          800: "#103d07",
          900: "#0b2c05",
          950: "#071803",
        },
        surface: {
          DEFAULT: "#09090b",
          "900":   "#111117",
          "800":   "#18181f",
          "700":   "#222230",
          "600":   "#2d2d3a",
        },
      },

      // ── Border radius ──────────────────────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // ── Spacing ────────────────────────────────────────────────────────────
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
      },

      // ── Box shadows ────────────────────────────────────────────────────────
      boxShadow: {
        // Glow — brand green
        "glow-sm":      "0 0 14px -2px rgba(28,102,12,0.35)",
        "glow":         "0 0 28px -4px rgba(28,102,12,0.45)",
        "glow-lg":      "0 0 56px -8px rgba(28,102,12,0.55)",
        "glow-rose":    "0 0 28px -4px rgba(244,63,94,0.4)",
        "glow-emerald": "0 0 28px -4px rgba(16,185,129,0.4)",
        // Light mode card
        "glass-light":  "0 2px 12px 0 rgba(16,16,28,0.07), 0 1px 3px 0 rgba(16,16,28,0.05)",
        "card-lift":    "0 4px 20px 0 rgba(16,16,28,0.10), 0 1px 4px 0 rgba(16,16,28,0.06)",
        // Dark mode card
        "glass-dark":   "0 8px 40px 0 rgba(0,0,0,0.65), 0 2px 8px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
        "card":         "0 1px 4px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "inner-dark":   "inset 0 1px 0 rgba(255,255,255,0.07)",
      },

      // ── Animations ─────────────────────────────────────────────────────────
      animation: {
        "fade-up":      "fade-up 0.5s ease-out forwards",
        "fade-in":      "fade-in 0.3s ease-out forwards",
        "scale-in":     "scale-in 0.2s ease-out forwards",
        "shimmer":      "shimmer 2.4s linear infinite",
        "pulse-slow":   "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "count-up":     "count-up 0.8s ease-out forwards",
        "float":        "float1 9s ease-in-out infinite",
        "float-slow":   "float2 13s ease-in-out infinite",
        "float-fast":   "float3 7s ease-in-out infinite",
        "spin-slow":    "spin 20s linear infinite",
        "gradient":     "gradient-shift 6s ease infinite",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "count-up": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
      },

      // ── Background images ──────────────────────────────────────────────────
      backgroundImage: {
        "gradient-radial":       "radial-gradient(var(--tw-gradient-stops))",
        "brand-gradient":        "linear-gradient(135deg,#1c660c 0%,#27a81b 100%)",
        "brand-gradient-subtle": "linear-gradient(135deg,rgba(28,102,12,0.12) 0%,rgba(39,168,27,0.06) 100%)",
        "page-mesh-light":       "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(28,102,12,0.07) 0%, transparent 70%)",
        "page-mesh-dark":        "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(28,102,12,0.12) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};
