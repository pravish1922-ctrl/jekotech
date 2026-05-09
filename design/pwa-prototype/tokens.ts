// packages/ui/tokens.ts — design tokens (drop into Tailwind config)

export const colors = {
  ink:        '#0B0D0E',
  ink2:       '#15181A',
  ink3:       '#1E2225',
  ink4:       '#2A2F33',
  steel:      '#3D4348',
  steel2:     '#5C6369',
  steel3:     '#8B9197',
  bone:       '#F2EFEA',
  bone2:      '#E5E1D8',
  bone3:      '#D4CFC2',
  paper:      '#FBFAF6',
  orange:     '#FF5A1F',
  orangeDeep: '#D9430C',
  yellow:     '#F5C518',
  lime:       '#C8FF3A',
  red:        '#E8412B',
  green:      '#2F9E5A',
};

export const fonts = {
  display: ['"Space Grotesk"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
  body:    ['"Inter"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
  mono:    ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
};

// Tailwind config snippet:
//
// theme: {
//   extend: {
//     colors,
//     fontFamily: { display: fonts.display, sans: fonts.body, mono: fonts.mono },
//     borderRadius: { DEFAULT: '0' },
//     boxShadow: { ticket: '4px 4px 0 #0B0D0E', 'ticket-lg': '6px 6px 0 #0B0D0E' },
//     letterSpacing: { mono: '0.08em', tighter: '-0.02em' },
//   }
// }
