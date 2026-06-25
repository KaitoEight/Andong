import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Hạ target để chạy được trên trình duyệt cũ trên Windows 7 (Chrome 109 / Firefox ESR 115)
  build: {
    target: ['es2019', 'chrome79', 'firefox70', 'edge88'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
