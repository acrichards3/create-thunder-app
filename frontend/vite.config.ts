import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasEnv = (value: string | undefined): value is string => value != null && value.length > 0;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const vitePort = hasEnv(env.VITE_PORT) ? Number(env.VITE_PORT) : 5173;
  const backendUrl = hasEnv(env.VITE_BACKEND_URL) ? env.VITE_BACKEND_URL : "http://localhost:3000";

  return {
    plugins: [
      tanstackRouter({
        autoCodeSplitting: true,
        target: "react",
      }),
      react(),
    ],
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      cors: false,
      port: vitePort,
      proxy: {
        "/api/auth": {
          changeOrigin: true,
          target: backendUrl,
        },
      },
      watch: {
        ignored: ["**/routeTree.gen.ts", "**/*.tsbuildinfo"],
      },
    },
  };
});
