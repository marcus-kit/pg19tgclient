import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F7941D',
          50: '#FEF3E6',
          100: '#FDE7CD',
          200: '#FBCF9B',
          300: '#F9B769',
          400: '#F8A543',
          500: '#F7941D',
          600: '#D67A0A',
          700: '#A45E08',
          800: '#724106',
          900: '#402504'
        },
        secondary: {
          DEFAULT: '#E91E8C',
          50: '#FCE8F4',
          100: '#F9D1E9',
          200: '#F3A3D3',
          300: '#ED75BD',
          400: '#EB49A4',
          500: '#E91E8C',
          600: '#C4146F',
          700: '#930F53',
          800: '#620A37',
          900: '#31051C'
        },
        accent: {
          DEFAULT: '#00A651',
          50: '#E6F7EE',
          100: '#CCEFDD',
          200: '#99DFBB',
          300: '#66CF99',
          400: '#33BF77',
          500: '#00A651',
          600: '#008541',
          700: '#006431',
          800: '#004321',
          900: '#002110'
        },
        info: {
          DEFAULT: '#0054A6',
          50: '#E6EEF7',
          100: '#CCDEF0',
          200: '#99BDE1',
          300: '#669CD2',
          400: '#337BC3',
          500: '#0054A6',
          600: '#004385',
          700: '#003264',
          800: '#002243',
          900: '#001121'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(247, 148, 29, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(247, 148, 29, 0.6)' }
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'glass-hover': '0 20px 40px rgba(247, 148, 29, 0.15), 0 0 60px rgba(247, 148, 29, 0.1)',
        'glow-primary': '0 0 30px rgba(247, 148, 29, 0.4)',
        'glow-secondary': '0 0 30px rgba(233, 30, 140, 0.4)',
        'glow-accent': '0 0 30px rgba(0, 166, 81, 0.4)',
      }
    }
  },
  plugins: []
} satisfies Config
