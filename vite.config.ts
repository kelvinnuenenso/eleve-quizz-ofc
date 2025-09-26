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
      host: "0.0.0.0",
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
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    force: mode === 'development'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: mode === 'development',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'sonner', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    chunkSizeWarningLimit: 1000
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  }
}));
