/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgb(0 0 0 / 0.04)',
        'soft-lg': '0 4px 16px 0 rgb(0 0 0 / 0.06)',
        'soft-xl': '0 8px 24px 0 rgb(0 0 0 / 0.08)',
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
