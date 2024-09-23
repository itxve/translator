import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import alias from "@rollup/plugin-alias";
import { genInputEntry } from "./src/build";

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => ({
  plugins: [
    react(),
    alias({
      entries: [
        { find: "@assets", replacement: resolve(__dirname, "src/assets") },
        { find: "@src", replacement: resolve(__dirname, "src") },
        { find: "@pages", replacement: resolve(__dirname, "src/pages") },
      ],
    }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      input: genInputEntry(command, 1420),
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return `vendor`;
          }
        },
        entryFileNames({ name }) {
          // const { facadeModuleId, moduleIds } = chunkInfo;
          // console.log("chunkInfo:", { facadeModuleId, moduleIds });
          return `[name]/index.js`;
        }, //入口文件
        chunkFileNames() {
          return `js/[name]-[hash].js`;
        }, //分包引入文件
        assetFileNames(assetInfo) {
          //文件名称
          if (assetInfo.name.endsWith(".css")) {
            return "css/[name]-[hash].css";
          }
          //图片名称
          //定义图片后缀
          const imgExts = [
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".gif",
            ".svg",
            ".ico",
          ];
          if (imgExts.some((ext) => assetInfo.name.endsWith(ext))) {
            return "imgs/[name]-[hash].[ext]";
          }
          //剩余资源文件
          return "assets/[name]-[hash].[ext]";
        },
        
      },
    },
  },
}));
