import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

export default {
  content: [
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{html,js,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        textclip: "textclip 4s linear infinite",
      },
      keyframes: {
        textclip: {
          "0%, 100%": { backgroundPosition: "200% auto" },
          "50%": { backgroundPosition: "-200% center" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
} satisfies Config;
