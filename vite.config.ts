import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext', // Allow modern features in dependencies
    },
  },
  build: {
    target: 'esnext', // Build target for top-level await support
  },
  server: {
    host: true,
    port: 3000,
  }
});