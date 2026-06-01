import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Exposes the server on your local network
    proxy: {
      '/api': 'http://localhost:3001', // Routes API calls to our new SQLite backend
    },
  },
});