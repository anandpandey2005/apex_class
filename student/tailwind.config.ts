import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        card: {
          DEFAULT: '#09090b',
          foreground: '#ffffff',
        },
        popover: {
          DEFAULT: '#09090b',
          foreground: '#ffffff',
        },
        primary: {
          DEFAULT: '#ffffff',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#18181b',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#18181b',
          foreground: '#a1a1aa',
        },
        accent: {
          DEFAULT: '#27272a',
          foreground: '#ffffff',
        },
        border: '#27272a',
        input: '#18181b',
        ring: '#ffffff',
      },
    },
  },
  plugins: [],
};

export default config;
