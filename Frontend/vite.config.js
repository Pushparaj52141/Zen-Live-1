// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
  },
  build: {
    // Enable code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'reselect'],
          'dnd-vendor': ['@hello-pangea/dnd'],
          'ui-vendor': ['sweetalert2', 'react-select', 'react-icons'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Disable sourcemaps in production for smaller bundles
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
    ],
  },
})

