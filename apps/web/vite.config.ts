import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

const developmentProxy = process.env.VITE_API_ORIGIN
  ? {
      "/api": { target: process.env.VITE_API_ORIGIN, changeOrigin: false },
      "/auth": { target: process.env.VITE_API_ORIGIN, changeOrigin: false },
    }
  : undefined;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Time Tracker",
        short_name: "Time Tracker",
        description: "Shared time tracking for your organization.",
        theme_color: "#172554",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "/",
      },
    }),
  ],
  ...(developmentProxy ? { server: { proxy: developmentProxy } } : {}),
});
