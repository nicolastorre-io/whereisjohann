import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/whereisjohann/',
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    commonjsOptions: {
      include: [/shared/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
})
