import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600, // Raised to accommodate Swagger UI's inherently large bundle
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/swagger-ui-react') || id.includes('node_modules/swagger-ui')) {
            return 'swagger-ui'; // Isolates all Swagger dependencies into one named chunk
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor'; // Isolates React core for better browser caching
          }
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})