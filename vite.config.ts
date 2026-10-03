/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/azure_study_hub/',
  plugins: [react(), tailwindcss()],
  build: {
    // The content chunk is educational data (~200 KB gzipped), not code; warn only past that.
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        // Keep the study content and vendor libraries in their own long-lived chunks.
        codeSplitting: {
          groups: [
            { name: 'content', test: /[\\/]content[\\/]/ },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
