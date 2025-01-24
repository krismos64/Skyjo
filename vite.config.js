import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/socket.io": {
        target: "ws://localhost:3000",
        ws: true,
      },
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      external: [
        // Add the module Rollup failed to resolve here
        "/assets/index-15559f11.js",
      ],
    },
    outDir: "dist",
    assetsDir: "assets",
  },
});
