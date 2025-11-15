
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   base: "/", // ✅ absolute for Vercel
//   build: {
//     outDir: "dist",
//     assetsDir: "assets",
//     emptyOutDir: true,
//   },
//   server: {
//     port: 5173,
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});

