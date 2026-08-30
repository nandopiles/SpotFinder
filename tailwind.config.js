/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
        },
        surface: {
          DEFAULT:       'var(--color-surface)',
          muted:         'var(--color-surface-muted)',
          subtle:        'var(--color-surface-subtle)',
          border:        'var(--color-surface-border)',
          'border-strong': 'var(--color-surface-border-strong)',
        },
        ink: {
          DEFAULT:   'var(--color-ink)',
          secondary: 'var(--color-ink-secondary)',
          muted:     'var(--color-ink-muted)',
          faint:     'var(--color-ink-faint)',
        },
      },
      fontFamily: {
        sans:    ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'xs':        '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'card':      '0 1px 3px 0 rgb(79 70 229 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover':'0 8px 24px -4px rgb(79 70 229 / 0.14), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
        'card-active':'0 2px 8px -2px rgb(79 70 229 / 0.2)',
        'modal':     '0 24px 64px -12px rgb(0 0 0 / 0.28)',
        'glow':      '0 0 0 3px rgb(99 102 241 / 0.2)',
        'glow-sm':   '0 0 0 2px rgb(99 102 241 / 0.15)',
        'inner-sm':  'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%)',
        'gradient-card':    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-warm':    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-nature':  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-food':    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        'gradient-culture': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'gradient-leisure': 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
        'gradient-shopping':'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
        'noise':            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':        'fadeIn 0.25s ease-out forwards',
        'fade-up':        'fadeUp 0.3s ease-out forwards',
        'scale-in':       'scaleIn 0.2s ease-out forwards',
        'slide-in-left':  'slideInLeft 0.3s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'slide-out-right': 'slideOutRight 0.3s ease-in forwards',
        'shimmer':        'shimmer 1.8s linear infinite',
        'pulse-soft':     'pulseSoft 2s ease-in-out infinite',
        'bounce-soft':    'bounceSoft 0.5s ease-out forwards',
        'spin-slow':      'spin 3s linear infinite',
        'spin-reverse':   'spinReverse 2s linear infinite',
        'orbit':          'orbit 2.4s linear infinite',
        'dot-bounce':     'dotBounce 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideOutRight: {
          '0%':   { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        bounceSoft: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        spinReverse: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateX(18px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(18px) rotate(-360deg)' },
        },
        dotBounce: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%':           { transform: 'scale(1)',   opacity: '1'   },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
