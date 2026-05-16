import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 8000, // Increased to handle the 7MB lexicon chunk
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('legitimateDoubles')) {
            return 'forensic-lexicon'; // Move the 450k words to their own file
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
