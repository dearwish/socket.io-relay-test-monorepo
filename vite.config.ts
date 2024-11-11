import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'apps/website',
  publicDir: '../public',
  server: {
    port: 3000,
  },
  build: {
    outDir: '../../dist/apps/website',
    emptyOutDir: true,
    rollupOptions: {
      input: 'apps/website/public/index.html', // Ensure this points to the correct location
    },
  },
  plugins: [react()],
});