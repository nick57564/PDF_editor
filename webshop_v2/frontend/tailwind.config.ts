import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        gold: { DEFAULT: "#c8a96e", light: "#dfc08a", dark: "#a8894e" },
        maison: { black: "#1a1a1a", light: "#f7f5f2", mid: "#e8e4df", border: "#e0dbd4" },
      },
      animation: {
        "fade-in": "fadeIn .4s ease forwards",
        "slide-up": "slideUp .4s ease forwards",
        marquee: "marquee 25s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
    },
  },
  plugins: [],
};
export default config;
