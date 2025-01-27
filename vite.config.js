import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/socket.io": {
        target: "http://localhost:10000",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
    },
  },
});
