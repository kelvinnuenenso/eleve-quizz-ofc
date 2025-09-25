import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      port: 8080,
      host: "localhost",
      clientPort: 8080,
    },
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api/consolidated': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/quizzes': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  }
}));
