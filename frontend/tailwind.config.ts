import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      boxShadow: {
        soft: "0 22px 60px rgba(0, 74, 122, 0.10)",
        glow: "0 0 0 1px rgba(77, 182, 231, 0.14), 0 26px 90px rgba(0, 101, 169, 0.14)",
        panel: "0 14px 36px rgba(47, 58, 69, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
