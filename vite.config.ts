import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Token endpoint  →  https://accounts.spotify.com/api/token
      "/spotify-token": {
        target: "https://accounts.spotify.com",
        changeOrigin: true,
        rewrite: () => "/api/token",
      },
      // API endpoints  →  https://api.spotify.com/v1/...
      "/spotify-api": {
        target: "https://api.spotify.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/spotify-api/, "/v1"),
      },
    },
  },
});
