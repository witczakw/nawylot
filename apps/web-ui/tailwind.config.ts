import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import {
  palettes,
  spacing,
  radius,
  fontFamily,
  typeScale,
  shadow,
  motion,
  layout,
} from './src/design/tokens'

const toVars = (p: Record<string, string>) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [`--c-${k}`, v]))

const colors = Object.fromEntries(Object.keys(palettes.light).map((k) => [k, `var(--c-${k})`]))

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: { transparent: 'transparent', current: 'currentColor', ...colors },
    spacing,
    borderRadius: radius,
    fontFamily,
    fontSize: typeScale,
    boxShadow: shadow,
    transitionTimingFunction: { DEFAULT: motion.ease },
    transitionDuration: {
      DEFAULT: motion.base,
      fast: motion.fast,
      base: motion.base,
      slow: motion.slow,
    },
    extend: {
      maxWidth: layout,
      width: { toast: layout.toast },
      keyframes: {
        'calm-pulse': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.55' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'drop-in': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'calm-pulse': `calm-pulse 1.6s ${motion.ease} infinite`,
        'fade-in': `fade-in ${motion.base} ${motion.ease} both`,
        'rise-in': `rise-in ${motion.slow} ${motion.ease} both`,
        'drop-in': `drop-in ${motion.fast} ${motion.ease} both`,
        spin: 'spin 800ms linear infinite',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...toVars(palettes.light), colorScheme: 'light' },
        '@media (prefers-color-scheme: dark)': {
          ':root:not([data-theme="light"])': { ...toVars(palettes.dark), colorScheme: 'dark' },
        },
        ':root[data-theme="dark"]': { ...toVars(palettes.dark), colorScheme: 'dark' },
      })
    }),
  ],
} satisfies Config
