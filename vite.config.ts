import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    react(), // suficiente para la mayoría de los proyectos React + TS
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Solo incluye esto si estás en WSL, Docker o tienes problemas con los hot reloads
    // watch: { usePolling: true, interval: 800 },
  },
});