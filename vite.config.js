import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  if (isBuild) {
    process.env.NODE_ENV = 'production';
  }

  return {
    mode: isBuild ? 'production' : mode,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/sitemap.xml': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
