import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  define: { global: "globalThis" },
  plugins: [
    react(),
    svgr({ include: "**/*.svg?react" }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Tikitaka Frontend V2",
        short_name: "Tikitaka V2",
        description: "TODO: 새 서비스 설명을 입력하세요.",
        theme_color: "#2766ec",
        background_color: "#f2f2f7",
        display: "standalone",
        start_url: "/",
        icons: [],
      },
    }),
  ],
});
