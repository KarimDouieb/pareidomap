/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        ikb: '#002FA7',
        'ikb-soft': '#E6EBF7',
      },
      fontFamily: {
        sans:  ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono:  ['Geist Mono', 'ui-monospace', 'Menlo', 'monospace'],
        hand:  ['Caveat', 'cursive'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl:  'var(--radius-xl)',
        lg:  'var(--radius-lg)',
        DEFAULT: 'var(--radius)',
        sm:  'var(--radius-sm)',
      },
      fontSize: {
        '2xs': ['10.5px', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [],
}
