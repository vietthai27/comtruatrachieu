import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // nghe trên mọi interface để máy khác cùng mạng (điện thoại) truy cập được
    proxy: { '/api': 'http://localhost:8080' },
  },
})
