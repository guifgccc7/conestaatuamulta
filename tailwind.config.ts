import type { Config } from "tailwindcss";

// Absolute path anchored to this config file's location.
// Using a string literal avoids __dirname / import.meta.url
// compatibility issues across the different module contexts
// (jiti, ts-node, Next.js bundler) that load this file.
const APP_ROOT = "/Users/Gui/Desktop/conestaatuamulta";

const config: Config = {
  content: [
    `${APP_ROOT}/src/pages/**/*.{js,ts,jsx,tsx,mdx}`,
    `${APP_ROOT}/src/components/**/*.{js,ts,jsx,tsx,mdx}`,
    `${APP_ROOT}/src/app/**/*.{js,ts,jsx,tsx,mdx}`,
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        portugal: {
          red:   "#cc0000",
          green: "#006600",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
