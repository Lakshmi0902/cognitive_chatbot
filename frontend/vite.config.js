// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   build: {
//     outDir: 'dist'
//   }
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration
export default defineConfig({
  plugins: [react()],
  root: '.',              // root is the current folder (frontend)
  build: {
    outDir: 'dist',       // build output folder
    emptyOutDir: true     // clean dist folder before each build
  },
  server: {
    port: 5173            // optional - for local dev
  }
})

