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
    },
  },
  plugins: [],
};

export default config;
