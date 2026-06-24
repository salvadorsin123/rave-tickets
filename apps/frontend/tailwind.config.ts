import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#07050d',
          900: '#0d0a17',
          850: '#120e1f',
          800: '#181228',
          700: '#241a3a',
          600: '#33254f',
        },
        neon: {
          violet: '#a855f7',
          cyan: '#22d3ee',
          pink: '#ec4899',
          green: '#34d399',
          red: '#f43f5e',
          amber: '#fbbf24',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(168, 85, 247, 0.35)',
        'neon-cyan': '0 0 20px rgba(34, 211, 238, 0.35)',
        'neon-green': '0 0 40px rgba(52, 211, 153, 0.55)',
        'neon-red': '0 0 40px rgba(244, 63, 94, 0.55)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
