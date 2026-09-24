/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Space Canvas & Deep Dark HUD Palette
        space: {
          900: '#090e1a',
          950: '#05070d',
        },
        // Cyber Accent Tokens from Reference Project
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        cyan: {
          400: '#38bdf8',
          500: '#06b6d4',
          600: '#0891b2',
        },
        purple: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        // Target Production Brand Colors (Preserved 100%)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#041c2d',
        },
        // Target Production Surface Colors (Preserved 100%)
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Glassmorphism Token Palette
        glass: {
          bg: 'rgba(18, 25, 42, 0.75)',
          hover: 'rgba(26, 36, 60, 0.88)',
          card: 'rgba(20, 29, 48, 0.72)',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(255, 255, 255, 0.16)',
        }
      },
      boxShadow: {
        glass: '0 12px 40px 0 rgba(0, 0, 0, 0.65)',
        'glow-green': '0 0 35px rgba(16, 185, 129, 0.25)',
        'glow-gold': '0 0 35px rgba(245, 158, 11, 0.3)',
        'glow-cyan': '0 0 35px rgba(56, 189, 248, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Vazirmatn', 'Tahoma', 'sans-serif'],
        persian: ['Vazirmatn', 'Tahoma', 'Segoe UI', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
