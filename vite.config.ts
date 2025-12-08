import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

const REPO_NAME = 'MetodoSimplex';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: REPO_NAME ? `/${REPO_NAME}/` : '/',
  server: {
    // Solo incluye esto si estás en WSL, Docker o tienes problemas con los hot reloads
    // watch: { usePolling: true, interval: 800 },
  },
});
