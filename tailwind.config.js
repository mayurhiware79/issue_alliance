// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// } 

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode variant
  theme: {
    extend: {
      colors: {
        // Theme colors using CSS variables
        theme: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          background: 'var(--color-background)',
          'background-secondary': 'var(--color-background-secondary)',
          text: 'var(--color-text)',
          'text-secondary': 'var(--color-text-secondary)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'float-0': 'float1 20s ease-in-out infinite',
        'float-1': 'float2 25s ease-in-out infinite',
        'float-2': 'float3 30s ease-in-out infinite',
        'float-3': 'float4 35s ease-in-out infinite',
        'float-4': 'float5 40s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'shimmer': 'shimmer 2.5s infinite linear',
        'highlight-row': 'highlightRow 2s ease-in-out',
        'trophy-shine': 'trophyShine 3s ease-in-out infinite',
        'badge-pop': 'badgePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'confetti': 'confetti 4s ease-in-out infinite',
      },
      keyframes: {
        float1: {
          '0%, 100%': { transform: 'translateY(0) rotate(0)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        float2: {
          '0%, 100%': { transform: 'translateY(0) rotate(0)' },
          '50%': { transform: 'translateY(-30px) rotate(-5deg)' },
        },
        float3: {
          '0%, 100%': { transform: 'translateY(0) rotate(0)' },
          '50%': { transform: 'translateY(-25px) rotate(8deg)' },
        },
        float4: {
          '0%, 100%': { transform: 'translateY(0) rotate(0)' },
          '50%': { transform: 'translateY(-20px) rotate(-8deg)' },
        },
        float5: {
          '0%, 100%': { transform: 'translateY(0) rotate(0)' },
          '50%': { transform: 'translateY(-35px) rotate(5deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        highlightRow: {
          '0%': { backgroundColor: 'rgba(59, 130, 246, 0)' },
          '50%': { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
          '100%': { backgroundColor: 'rgba(59, 130, 246, 0)' },
        },
        trophyShine: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(-100%) rotate(-30deg) scale(0.5)'
          },
          '20%': { 
            opacity: '1' 
          },
          '30%': { 
            opacity: '0',
            transform: 'translateX(100%) rotate(-30deg) scale(1.5)'
          },
          '100%': { 
            opacity: '0'
          }
        },
        badgePop: {
          '0%': { 
            transform: 'scale(0)',
            opacity: '0'
          },
          '70%': { 
            transform: 'scale(1.1)',
            opacity: '1'
          },
          '100%': { 
            transform: 'scale(1)'
          }
        },
        scaleIn: {
          '0%': { 
            transform: 'scale(0.8)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        confetti: {
          '0%': { 
            transform: 'translateY(0) rotate(0deg)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(-100px) rotate(720deg)',
            opacity: '0'
          }
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      }
      addUtilities(newUtilities);
    }
  ],
}
