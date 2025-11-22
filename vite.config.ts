import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Crucial for GitHub Pages - loads assets with relative paths
  base: './',
  // Fixes "process is not defined" error in browser and injects API key from build environment
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
});