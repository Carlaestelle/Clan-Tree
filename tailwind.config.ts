import type { Config } from "tailwindcss";

const config: Config = {
  // Tailwind scans these files at build time to figure out which
  // utility classes you actually used, and only ships CSS for those —
  // if a folder with classes isn't listed here, its styles get silently
  // dropped in production. Add new folders here as the project grows.
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Placeholder — once we lock in the visual design from your
      // reference images, the clan's palette and fonts will live here
      // (e.g. colors.ink, colors.parchment, fontFamily.display) so every
      // component pulls from the same named tokens instead of one-off hex codes.
    },
  },
  plugins: [],
};

export default config;
