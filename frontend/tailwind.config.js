/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
     screens: {
      'sm': {'min': '576px', 'max': '575.98px'},
      'md': {'min': '768px', 'max': '992px'},
      'lg': {'min': '992px', 'max': '1200px'},
      'xl': {'min': '1200px', 'max': '1400px'},
    },
  },
  plugins: [],
};
