/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
      // The shared workspace packages are symlinked, so make sure they resolve the app's
      // single copy of these rather than one next to their own package.json.
      dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    },
    server: {
      // Same-origin API calls in dev: the backend has no CORS config (see .env).
      proxy: { '/psc': env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080' },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
