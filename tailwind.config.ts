import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Botanical Minimalism
        sage: {
          50: '#F5F6F5',
          100: '#E8EBE9',
          200: '#D1D7D3',
          300: '#A8B2AB',
          400: '#879388',
          500: '#6B7F6E', // Primary brand color
          600: '#5A6D5D',
          700: '#4F5F51',
          800: '#404E42',
          900: '#2D3730',
        },
        terracotta: {
          50: '#F9F4F2',
          100: '#F2E7E1',
          200: '#E5CDC3',
          300: '#D3A794',
          400: '#C59378',
          500: '#B8826B', // Accent color
          600: '#A26B54',
          700: '#845545',
          800: '#6A453A',
          900: '#4E3329',
        },
        // Warm Neutral Scale
        warm: {
          50: '#F5F3F0',
          100: '#E8E4DD',
          200: '#D9D4CB',
          300: '#C8C3B9',
          400: '#A9A49A',
          500: '#8A857A',
          600: '#6E6960',
          700: '#5A564F',
          800: '#434039',
          900: '#2E2B27',
        },
        // Semantic Colors (WCAG AAA compliant)
        success: {
          DEFAULT: '#4A7C59',
          light: '#E8F3EB',
          dark: '#3A5F42',
        },
        error: {
          DEFAULT: '#B44C3D',
          light: '#F9E8E6',
          dark: '#8A3D31',
        },
        warning: {
          DEFAULT: '#C89B5A',
          light: '#F7F0E4',
          dark: '#8C6E3E',
        },
        info: {
          DEFAULT: '#5F7A8A',
          light: '#E9EEF1',
          dark: '#4A5F6E',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Mobile-first responsive typography
        'display-xl': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }], // 32px
        'display-l': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }], // 28px
        'h1': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }], // 20px
        'h2': ['1rem', { lineHeight: '1.4', fontWeight: '600' }], // 16px
        'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }], // 16px
        'body': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }], // 14px
        'body-sm': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }], // 12px
        'label': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' }], // 14px
      },
      spacing: {
        xs: '0.25rem', // 4px
        sm: '0.5rem', // 8px
        md: '1rem', // 16px
        lg: '1.5rem', // 24px
        xl: '2rem', // 32px
        '2xl': '3rem', // 48px
        '3xl': '4rem', // 64px
      },
      borderRadius: {
        sm: '0.25rem', // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.5rem', // 8px
        lg: '0.75rem', // 12px
        xl: '1rem', // 16px
        '2xl': '1.5rem', // 24px
        full: '9999px',
      },
      boxShadow: {
        // Aesop-inspired: subtle, warm shadows
        sm: '0 1px 2px 0 rgba(46, 43, 39, 0.04)',
        DEFAULT: '0 2px 8px 0 rgba(46, 43, 39, 0.06)',
        md: '0 4px 16px 0 rgba(46, 43, 39, 0.08)',
        lg: '0 8px 24px 0 rgba(46, 43, 39, 0.10)',
        xl: '0 16px 48px 0 rgba(46, 43, 39, 0.12)',
        '2xl': '0 24px 64px 0 rgba(46, 43, 39, 0.16)',
        'sage-glow': '0 4px 16px 0 rgba(107, 127, 110, 0.15)',
        'terracotta-glow': '0 4px 16px 0 rgba(184, 130, 107, 0.15)',
      },
      opacity: {
        disabled: '0.38',
        hint: '0.60',
        secondary: '0.74',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
