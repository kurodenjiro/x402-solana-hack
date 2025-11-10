import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#f8f9fb',
          100: '#eceef5',
          200: '#d8dcef',
          900: '#09090b',
        },
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          500: '#7c3aed',
          600: '#6d28d9',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 60px 160px -60px rgba(124, 58, 237, 0.65)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config


