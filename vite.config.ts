/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the built site works under any folder, such as a GitHub Pages project address.
  base: "./",
  server: { host: "127.0.0.1", port: 5180, strictPort: true },
  // Load the real stylesheet in tests (Vitest stubs CSS by default), so the
  // stylesheet guards in src/styles/styles.test.ts read actual rules.
  test: {
    css: {
      include: [
        /nox\.css/,
        /chapter\.css/,
        /story\.css/,
        /devicePower\.css/,
        /cpuPower\.css/,
        /sleepWake\.css/,
        /underHood\.css/,
      ],
    },
  },
});
