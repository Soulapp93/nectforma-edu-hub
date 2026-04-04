import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode: _mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-icon-512.png', 'og-image.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: 'Nectforma - Gestion de formations',
        short_name: 'Nectforma',
        description: 'Plateforme tout-en-un de gestion de centres de formation',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  assetsInclude: ['**/*.pdf'],
  build: {
    // Use esbuild instead of terser — much less memory usage
    minify: 'esbuild',
    sourcemap: false,
    // Increase chunk size warning to avoid noise
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core — must load first, keep together
            if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@radix-ui') || id.includes('lucide-react')) return 'vendor-ui';
            if (id.includes('react-pdf') || id.includes('pdfjs-dist')) return 'vendor-pdf';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('fabric')) return 'vendor-fabric';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('@daily-co')) return 'vendor-daily';
            if (id.includes('mammoth') || id.includes('jspdf') || id.includes('html2canvas') || id.includes('jszip')) return 'vendor-document';
            return 'vendor-misc';
          }
        },
      },
    },
  },
  define: {
    __DEV__: _mode === 'development',
  },
}));
