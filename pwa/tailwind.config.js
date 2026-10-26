/** @type {import('tailwindcss').Config} */

/**
 * All colors resolve through the M3 token layer in src/styles/design-tokens.css
 * (`md-*` roles). Channel-triplet vars + `rgb(var(..) / <alpha-value>)` keep
 * alpha modifiers (e.g. bg-md-surface/90) working.
 */
const role = (name) => `rgb(var(--md-sys-color-${name}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        md: {
          primary: role('primary'),
          'on-primary': role('on-primary'),
          'primary-container': role('primary-container'),
          'on-primary-container': role('on-primary-container'),
          secondary: role('secondary'),
          'on-secondary': role('on-secondary'),
          'secondary-container': role('secondary-container'),
          'on-secondary-container': role('on-secondary-container'),
          tertiary: role('tertiary'),
          'on-tertiary': role('on-tertiary'),
          'tertiary-container': role('tertiary-container'),
          'on-tertiary-container': role('on-tertiary-container'),
          error: role('error'),
          'on-error': role('on-error'),
          'error-container': role('error-container'),
          'on-error-container': role('on-error-container'),
          success: role('success'),
          'on-success': role('on-success'),
          'success-container': role('success-container'),
          'on-success-container': role('on-success-container'),
          'success-inverse': role('success-inverse'),
          warning: role('warning'),
          'on-warning': role('on-warning'),
          'warning-container': role('warning-container'),
          'on-warning-container': role('on-warning-container'),
          'warning-inverse': role('warning-inverse'),
          surface: role('surface'),
          'surface-dim': role('surface-dim'),
          'surface-bright': role('surface-bright'),
          'surface-container-lowest': role('surface-container-lowest'),
          'surface-container-low': role('surface-container-low'),
          'surface-container': role('surface-container'),
          'surface-container-high': role('surface-container-high'),
          'surface-container-highest': role('surface-container-highest'),
          'on-surface': role('on-surface'),
          'on-surface-variant': role('on-surface-variant'),
          outline: role('outline'),
          'outline-variant': role('outline-variant'),
          'inverse-surface': role('inverse-surface'),
          'inverse-on-surface': role('inverse-on-surface'),
          'inverse-primary': role('inverse-primary'),
          scrim: role('scrim'),
        },
      },
      fontFamily: {
        sans: ['Roboto Flex', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'm3-none': 'var(--m3-shape-none)',
        'm3-xs': 'var(--m3-shape-xs)',
        'm3-sm': 'var(--m3-shape-sm)',
        'm3-md': 'var(--m3-shape-md)',
        'm3-lg': 'var(--m3-shape-lg)',
        'm3-lg-inc': 'var(--m3-shape-lg-inc)',
        'm3-xl': 'var(--m3-shape-xl)',
        'm3-xl-inc': 'var(--m3-shape-xl-inc)',
        'm3-xxl': 'var(--m3-shape-xxl)',
        'm3-full': 'var(--m3-shape-full)',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      boxShadow: {
        // M3 elevation levels (design-tokens.css --md-sys-elevation-*)
        'm3-1': 'var(--md-sys-elevation-1)',
        'm3-2': 'var(--md-sys-elevation-2)',
        'm3-3': 'var(--md-sys-elevation-3)',
        'm3-4': 'var(--md-sys-elevation-4)',
        'm3-5': 'var(--md-sys-elevation-5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'm3-spatial-fast': 'var(--m3-ease-spatial-fast)',
        'm3-spatial': 'var(--m3-ease-spatial-default)',
        'm3-spatial-slow': 'var(--m3-ease-spatial-slow)',
        'm3-effects-fast': 'var(--m3-ease-effects-fast)',
        'm3-effects': 'var(--m3-ease-effects-default)',
        'm3-effects-slow': 'var(--m3-ease-effects-slow)',
      },
      transitionDuration: {
        'm3-spatial-fast': 'var(--m3-dur-spatial-fast)',
        'm3-spatial': 'var(--m3-dur-spatial-default)',
        'm3-spatial-slow': 'var(--m3-dur-spatial-slow)',
        'm3-effects-fast': 'var(--m3-dur-effects-fast)',
        'm3-effects': 'var(--m3-dur-effects-default)',
        'm3-effects-slow': 'var(--m3-dur-effects-slow)',
      },
      screens: {
        'xs': '375px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      animation: {
        'achievement-unlock': 'achievementSlideIn var(--m3-dur-spatial-default) var(--m3-ease-spatial-default), achievementFadeOut 0.3s ease-in 2.7s forwards',
        'bounce-once': 'bounceOnce var(--m3-dur-spatial-fast) var(--m3-ease-spatial-fast)',
      },
      keyframes: {
        achievementSlideIn: {
          '0%': { transform: 'translateY(-100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        achievementFadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        bounceOnce: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.2)' },
          '50%': { transform: 'scale(0.9)' },
          '75%': { transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
