import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '::',
    port: 4173,
    strictPort: true,
    allowedHosts: ['terminal.local'],
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
});
