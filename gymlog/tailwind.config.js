/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['GeneralSans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          '50':  '#f0fdf4',
          '100': '#dcfce7',
          '200': 'var(--brand)',
          '300': 'var(--brand)',
          '400': 'var(--brand)',
          '500': 'var(--brand)',
          '600': 'var(--brand)',
          '700': 'var(--brand)',
          '800': 'var(--brand)',
          '900': 'var(--brand)',
          DEFAULT: 'var(--brand)',
          foreground: 'var(--brand-foreground)',
        },
        surface: {
          '0':   'var(--surface-0)',
          '1':   'var(--surface-1)',
          '2':   'var(--surface-2)',
          '3':   'var(--surface-3)',
          '4':   'var(--surface-3)',
          border: 'var(--surface-border)',
        },
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in':  'fadeIn 0.15s ease-out',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideUp:  { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      }
    },
  },
  plugins: [],
}
