import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxies n8n test and production webhooks to local n8n during development.
      '/webhook-test': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: (path) => path, // keep path as-is
      },
      '/webhook': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: (path) => path, // keep path as-is
      },
    },
  },
})
