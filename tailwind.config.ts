import type { Config } from "tailwindcss";

function withOpacity(cssVariable: string) {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${cssVariable}) / ${opacityValue})`;
    }
    return `rgb(var(${cssVariable}))`;
  };
}

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: withOpacity("--color-void"),
        ink: withOpacity("--color-ink"),
        charcoal: withOpacity("--color-charcoal"),
        ash: withOpacity("--color-ash"),
        mist: withOpacity("--color-mist"),
        bone: withOpacity("--color-bone"),
        paper: withOpacity("--color-paper"),
        signal: withOpacity("--color-signal"),
      } as any,
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;