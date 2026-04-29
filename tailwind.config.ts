import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f4f1e6',
          100: '#e6e0cc',
          200: '#cdc5a4',
          300: '#afa87c',
          400: '#8a8258',
          500: '#52683e',
          600: '#3c5430',
          700: '#2b3e22',
          800: '#1d2e18',
          900: '#142210',
          950: '#0c1509',
        },
      },
    },
  },
  plugins: [],
}
export default config
