export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        skyjo: {
          primary: "#2A2D43",
          secondary: "#3F88C5",
          accent: "#44BBA4",
          danger: "#FF6B6B",
          background: "#1A1C2B",
        },
      },
      animation: {
        "gradient-x": "gradient-x 8s ease infinite",
        "card-flip": "flip 0.6s ease-in-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        flip: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
