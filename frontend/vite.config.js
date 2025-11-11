// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// // ✅ Works for both localhost and Vercel (no hash needed)
// export default defineConfig({
//   plugins: [react()],
//   base: "./", // relative base for production builds
//   server: {
//     port: 5173, // default
//     open: true, // auto-open browser
//   },
// });
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// // ✅ Works perfectly for both localhost (dev) and Vercel (build)
// export default defineConfig(({ command }) => ({
//   plugins: [react()],
//   base: command === "serve" ? "./" : "/", // dev = relative, build = absolute
//   build: {
//     outDir: "dist",
//     assetsDir: "assets",
//     emptyOutDir: true,
//   },
// }));
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // ✅ absolute, required for Vercel to find /assets/*.js
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
});

