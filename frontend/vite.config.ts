import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
  // 配置静态资源别名
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});




