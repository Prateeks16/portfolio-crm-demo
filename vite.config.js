import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` is configurable so the same app can be served either at the site root
// (standalone) or under a sub-path like /shellx/ (embedded in prateeks16.in).
// Set VITE_BASE=/shellx/ at build time for the sub-path build.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
});
