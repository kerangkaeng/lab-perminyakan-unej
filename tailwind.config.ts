import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",       // primary text, near-black navy
        paper: "#EEF1EF",     // cool off-white background (not cream)
        petrol: {
          DEFAULT: "#0B3B4E", // deep teal-navy, primary brand
          light: "#154D63",
          dark: "#082B39",
        },
        rig: {
          DEFAULT: "#C9852E", // oil-amber accent, used sparingly
          light: "#E2A459",
          dark: "#9C6A20",
        },
        core: "#6E7B6D",      // muted olive-gray, "core sample" gray
        line: "#D7DCD8",      // hairline border
        mist: "#F6F7F5",      // card background, one step off paper
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "welllog": "repeating-linear-gradient(180deg, transparent, transparent 6px, rgba(11,59,78,0.08) 6px, rgba(11,59,78,0.08) 7px)",
      },
      letterSpacing: {
        widest2: "0.22em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,18,32,0.04), 0 1px 1px rgba(11,18,32,0.03)",
        "card-hover": "0 12px 24px -8px rgba(11,59,78,0.18), 0 4px 8px -4px rgba(11,59,78,0.10)",
        nav: "0 1px 0 rgba(11,18,32,0.06), 0 8px 24px -16px rgba(11,18,32,0.15)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
