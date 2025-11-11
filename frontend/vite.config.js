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
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // important for Vercel
});
