/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/options/**/*.{tsx,ts,html}'],
  theme: {
    extend: {
      colors: {
        gl: {
          primary: 'rgb(87, 141, 204)',
          'primary-hover': 'rgba(87, 141, 204, 0.8)',
          'primary-light': 'rgba(87, 141, 204, 0.1)',
          danger: '#AD0707',
          'danger-hover': '#8B0606',
          warning: '#C69B00',
          success: '#00AE42',
          info: 'rgb(87, 141, 204)',
          border: '#D0D0D0',
          'border-focus': 'rgb(87, 141, 204)',
          'bg-page': '#F5F5F5',
          'bg-card': '#FFFFFF',
          'bg-input': '#FFFFFF',
          'bg-header': '#FFFFFF',
          'bg-hover': '#F0F0F0',
          'bg-selected': '#E8F4FD',
          'text-primary': '#333333',
          'text-secondary': '#666666',
          'text-muted': '#999999',
          'text-link': 'rgb(87, 141, 204)',
        },
      },
      fontFamily: {
        gl: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'gl-base': '14px',
        'gl-sm': '12px',
        'gl-xs': '11px',
      },
    },
  },
  plugins: [],
};
