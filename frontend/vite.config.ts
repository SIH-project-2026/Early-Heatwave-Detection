import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({mode}) => ({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    } : undefined,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          map: ['maplibre-gl'],
          charts: ['recharts'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
}));
