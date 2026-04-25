/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Be Vietnam Pro', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#2C7A7B',
          foreground: '#FFFFFF',
          50: '#E6FFFA',
          100: '#B2F5EA',
          500: '#319795',
          700: '#2C7A7B',
          900: '#234E52',
        },
        secondary: {
          DEFAULT: '#D97706',
          foreground: '#FFFFFF',
          100: '#FEF3C7',
          500: '#F59E0B',
          700: '#B45309',
        },
        background: '#FDFBF7',
        surface: '#FFFFFF',
        text: {
          primary: '#2D3748',
          secondary: '#718096',
          muted: '#A0AEC0',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
 