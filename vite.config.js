import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(),tailwindcss()],
  // Base dinâmica: Vercel/Preview usa '/', GitHub Pages usa '/PhotoCloud/'
  base: process.env.VERCEL ? '/' : '/PhotoCloud/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    historyApiFallback: true,
  },
  build: {
    // Publicar em docs/ para usar GitHub Pages (main/docs)
    outDir: 'docs',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}))
