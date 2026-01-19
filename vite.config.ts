import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-table', '@tanstack/react-virtual'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['framer-motion', 'recharts', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
