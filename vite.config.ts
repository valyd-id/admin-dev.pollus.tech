import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// admin.valyd.work — back-office for the developer portal
export default defineConfig({
  server: {
    host: "::",
    port: 5174,
    proxy: {
      // In dev, forward API calls to the local Flask backend (same backend prod nginx proxies to).
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
