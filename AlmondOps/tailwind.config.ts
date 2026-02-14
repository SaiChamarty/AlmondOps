import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        soil: "#5B3A29",
        orchard: "#1F6B3B",
        cream: "#F9F7F2",
      },
    },
  },
  plugins: [],
};

export default config;
