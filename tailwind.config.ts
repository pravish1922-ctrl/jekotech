import type { Config } from 'tailwindcss'

// Shared design-token config — extended by apps/web/tailwind.config.ts
const config = {
  content: [],
  theme: {
    // Override ALL border-radius to 0 — industrial sharp-corner language
    borderRadius: {
      DEFAULT: '0px',
      none: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '9999px', // kept for status dots / avatar circles only
    },
    extend: {
      colors: {
        // Surfaces — graphite scale
        ink:       '#0B0D0E',
        ink2:      '#15181A',
        ink3:      '#1E2225',
        ink4:      '#2A2F33',
        steel:     '#3D4348',
        steel2:    '#5C6369',
        steel3:    '#8B9197',
        bone:      '#F2EFEA',
        bone2:     '#E5E1D8',
        bone3:     '#D4CFC2',
        paper:     '#FBFAF6',

        // Signal
        orange:     '#FF5A1F',
        orangeDeep: '#D9430C',
        yellow:     '#F5C518',
        lime:       '#C8FF3A',
        red:        '#E8412B',
        green:      '#2F9E5A',
      },

      fontFamily: {
        display: ['var(--font-display)', '"Space Grotesk"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        sans:    ['var(--font-sans)',    '"Inter"',         '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono:    ['var(--font-mono)',    '"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },

      boxShadow: {
        ticket:    '4px 4px 0 #0B0D0E',
        'ticket-lg': '6px 6px 0 #0B0D0E',
      },

      letterSpacing: {
        mono:    '0.08em',
        mono2:   '0.12em',
        tighter: '-0.02em',
        tight:   '-0.01em',
      },

      // 4px base scale extensions
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
      },

      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
      },

      keyframes: {
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        jkpulse: {
          '0%':   { boxShadow: '0 0 0 0 currentColor' },
          '70%':  { boxShadow: '0 0 0 8px transparent' },
          '100%': { boxShadow: '0 0 0 0 transparent' },
        },
        blink: {
          '50%': { opacity: '0.3' },
        },
      },

      animation: {
        scan:    'scan 1.4s linear infinite',
        jkpulse: 'jkpulse 1.6s infinite',
        blink:   'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
