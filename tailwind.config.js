/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B00',
          dark: '#E55A00',
          light: '#FFF3EB',
        },
        accent: '#FF8C38',
        secondary: '#1A1A2E',
        surface: {
          DEFAULT: '#F8F9FA',
          dark: '#F0F0F0',
        },
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
        'text-light': '#9CA3AF',
        border: '#E5E7EB',
        green: '#10B981',
        blue: '#3B82F6',
        purple: '#8B5CF6',
        orange: {
          DEFAULT: '#FF6B00',
          50: '#FFF3EB',
          100: '#FFE7D6',
          200: '#FFCEAD',
          500: '#FF6B00',
          600: '#E55A00',
          700: '#CC5000',
        },
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up-fast': 'fadeUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-fast': 'scaleIn 0.15s ease-out forwards',
        'pop-fast': 'scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'marquee': 'marquee 30s linear infinite',
        'slide-in-right': 'slideInRight 0.2s ease-out forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'counter': 'counter 1s ease-out forwards',
        'shimmer-bg': 'shimmerBg 2s linear infinite',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-up-stagger': 'slideUpStagger 0.5s ease-out forwards',
        'tilt': 'tilt 0.4s ease-out forwards',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'shimmer-line': 'shimmerLine 2.5s ease-in-out infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'glow-border': 'glowBorder 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(100px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,107,0,0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(255,107,0,0.3)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        counter: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmerBg: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUpStagger: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shrink: {
          from: { width: '100%' },
          to: { width: '0%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        tilt: {
          from: { opacity: '0', transform: 'perspective(800px) rotateX(10deg) translateY(20px)' },
          to: { opacity: '1', transform: 'perspective(800px) rotateX(0deg) translateY(0)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-12px) rotate(1deg)' },
          '66%': { transform: 'translateY(-6px) rotate(-1deg)' },
        },
        shimmerLine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        glowBorder: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(255,107,0,0.1), 0 0 20px rgba(255,107,0,0.05)' },
          '50%': { boxShadow: '0 0 0 1px rgba(255,107,0,0.3), 0 0 30px rgba(255,107,0,0.1)' },
        },
      },
    },
  },
  plugins: [],
}
