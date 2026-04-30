/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "sp-green": "#1ed760",
        "sp-green-dark": "#1db954",
        "sp-black": "#121212",
        "sp-dark": "#181818",
        "sp-mid": "#1f1f1f",
        "sp-card": "#252525",
        "sp-silver": "#b3b3b3",
        "sp-border": "#4d4d4d",
        "sp-light-border": "#7c7c7c",
      },
      boxShadow: {
        "sp-heavy": "rgba(0,0,0,0.5) 0px 8px 24px",
        "sp-medium": "rgba(0,0,0,0.3) 0px 8px 8px",
      },
      letterSpacing: {
        "spotify": "1.4px",
        "spotify-wide": "2px",
      },
    },
  },
  plugins: [],
};
