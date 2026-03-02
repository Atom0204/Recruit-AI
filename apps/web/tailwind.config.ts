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
      colors: {
        panel: "rgba(255, 255, 255, 0.05)"
      },
      boxShadow: {
        glow: "0 0 60px rgba(99, 102, 241, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
