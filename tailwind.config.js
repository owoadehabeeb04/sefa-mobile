/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary brand color (#3629B7)
        primary: {
          DEFAULT: '#3629B7',
          50: '#F5F4FF',
          100: '#E8E6FF',
          200: '#D1CCFF',
          300: '#B8B0FF',
          400: '#9D91FF',
          500: '#3629B7',
          600: '#2D21A0',
          700: '#241A89',
          800: '#1B1472',
          900: '#120D5B',
        },
        // Black shades for dark mode
        black: {
          DEFAULT: '#000000',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
          950: '#0A0A0A',
        },
        // Semantic colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        // Background colors (light mode)
        bg: {
          DEFAULT: '#FFFFFF',
          secondary: '#FAFAFA',
          tertiary: '#F5F5F5',
        },
        // Text colors (light mode)
        text: {
          DEFAULT: '#000000',
          primary: '#000000',
          secondary: '#424242',
          tertiary: '#757575',
          inverse: '#FFFFFF',
        },
        // Border colors
        border: {
          DEFAULT: '#E0E0E0',
          light: '#F5F5F5',
        },
        // Dark mode backgrounds
        dark: {
          bg: {
            DEFAULT: '#000000',
            secondary: '#0A0A0A',
            tertiary: '#212121',
          },
          text: {
            DEFAULT: '#FFFFFF',
            primary: '#FFFFFF',
            secondary: '#E0E0E0',
            tertiary: '#9E9E9E',
          },
          border: {
            DEFAULT: '#424242',
            light: '#212121',
          },
        },
      },
    },
  },
  plugins: [],
};