import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const DEFERRED_PRELOAD_CHUNK_PREFIXES = [
  "GitHubPage",
  "MatrixPage",
  "SettingsWorkspace",
  "chunk-github",
  "chunk-matrix",
];

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    modulePreload: {
      resolveDependencies: (_filename, dependencies) =>
        dependencies.filter(
          (dependency) => !DEFERRED_PRELOAD_CHUNK_PREFIXES.some((prefix) => dependency.includes(`${prefix}-`)),
        ),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");

          if (
            normalizedId.includes("/node_modules/react/")
            || normalizedId.includes("/node_modules/react-dom/")
          ) {
            return "vendor-react";
          }

          if (
            normalizedId.includes("/node_modules/react-markdown/")
            || normalizedId.includes("/node_modules/remark-gfm/")
          ) {
            return "vendor-markdown";
          }

          return undefined;
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
