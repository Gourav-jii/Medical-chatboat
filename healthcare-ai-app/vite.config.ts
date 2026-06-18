import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxies /webhook-test/* → http://localhost:5678
      // This avoids CORS errors when calling the n8n webhook from the browser
      '/webhook-test': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: (path) => path, // keep path as-is
      },
    },
  },
})
