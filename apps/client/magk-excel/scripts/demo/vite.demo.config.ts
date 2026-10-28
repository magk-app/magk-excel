import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'

// Browser-only dev server (no Electron) for the scripted analyst demo: /?demo=analyst
export default defineConfig({
  root: path.resolve(__dirname, '../..'),
  resolve: { alias: { '@': path.resolve(__dirname, '../../src') } },
  define: { global: 'globalThis' },
  plugins: [react()],
  server: { port: 5174, host: '127.0.0.1' },
})
