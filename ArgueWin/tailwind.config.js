/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'wechat-primary': '#F4B045',
        'wechat-primary-hover': '#E2A037',
        'wechat-primary-active': '#C5832A',
      },
    },
  },
  plugins: [],
}