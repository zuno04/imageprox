import path from "path";
/// <reference types="vitest" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from 'vite-tsconfig-paths'; // Re-enable

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()], // tsconfigPaths re-enabled
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
    },
  },
  // resolve: { // Manual aliases removed, tsconfigPaths will handle from tsconfig.json
  //   alias: {
  //     "@": path.resolve(__dirname, "./src"), 
  //   },
  // },
});
