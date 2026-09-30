/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mb-yellow': '#fee700',
        'mb-black': '#0a0a0a',
        'mb-dark': '#141414',
        'mb-charcoal': '#222222',
        'mb-pink': '#ff0055',
        'mb-magenta': '#c8004b',
        'mb-white': '#f5f5f0',
        'mb-bone': '#ded9c5',
        'mb-blood': '#900c14',
        'mb-decay': '#423d38',
      },
      fontFamily: {
        gothic: ['"UnifrakturMaguntia"', 'serif'],
        punk: ['"Special Elite"', 'monospace'],
        brutal: ['"Space Grotesk"', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px #0a0a0a',
        'brutal-sm': '2px 2px 0px #0a0a0a',
        'brutal-yellow': '4px 4px 0px #fee700',
        'brutal-pink': '4px 4px 0px #ff0055',
      }
    },
  },
  plugins: [],
}
