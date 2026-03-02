import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "../../packages/*/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"]
      },
      colors: {
        panel: "rgba(255, 255, 255, 0.05)",
        surface: {
          0: "rgb(9, 9, 11)",
          1: "rgb(18, 18, 22)",
          2: "rgb(28, 28, 35)",
          3: "rgb(38, 38, 48)"
        },
        accent: {
          DEFAULT: "rgb(99, 102, 241)",
          light: "rgb(129, 140, 248)",
          muted: "rgba(99, 102, 241, 0.15)"
        },
        success: {
          DEFAULT: "rgb(16, 185, 129)",
          light: "rgb(52, 211, 153)",
          muted: "rgba(16, 185, 129, 0.15)"
        },
        danger: {
          DEFAULT: "rgb(239, 68, 68)",
          light: "rgb(252, 129, 129)",
          muted: "rgba(239, 68, 68, 0.15)"
        },
        warn: {
          DEFAULT: "rgb(245, 158, 11)",
          muted: "rgba(245, 158, 11, 0.15)"
        }
      },
      boxShadow: {
        glow: "0 0 60px rgba(99, 102, 241, 0.25)",
        "glow-sm": "0 0 20px rgba(99, 102, 241, 0.15)",
        "glow-success": "0 0 40px rgba(16, 185, 129, 0.2)",
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.06)"
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px"
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
