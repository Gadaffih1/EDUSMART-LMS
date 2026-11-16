import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const EDUSMART_APP_VERSION = '2.0.0';

export default defineConfig(() => {
  // GitHub Pages serves this repo at /EDUSMART-LMS/. Local dev & edusmart.co.ke stay at /.
  const basePath = process.env.GITHUB_PAGES === 'true' ? '/EDUSMART-LMS/' : '/';

  return {
    base: basePath,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      __EDUSMART_APP_VERSION__: JSON.stringify(EDUSMART_APP_VERSION),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        filename: 'sw.js',
        manifestFilename: 'manifest.webmanifest',
        includeAssets: [
          'offline.html',
          'edusmart-portal-logo.jpeg',
          'edusmart-logo.svg',
          'apple-touch-icon.png',
          'favicon-32x32.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: basePath,
          name: 'EduSmart LMS',
          short_name: 'EduSmart',
          description:
            'Official EduSmart LMS & CBC Multi-Tenant School Portal for students, parents, teachers, and school leadership at edusmart.co.ke.',
          start_url: basePath,
          scope: basePath,
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          orientation: 'any',
          theme_color: '#0B3075',
          background_color: '#ffffff',
          lang: 'en',
          dir: 'ltr',
          categories: ['education', 'productivity'],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'edusmart-logo.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg,webp,woff2}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/offline\.html$/],
          runtimeCaching: [
            // CRITICAL SECURITY RULE: Never cache authenticated/authoritative LMS API or auth endpoints.
            {
              urlPattern: ({ url }) =>
                url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/'),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'edusmart-google-fonts-css',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'edusmart-google-fonts-woff',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ request, url }) =>
                request.destination === 'image' &&
                !url.pathname.startsWith('/api/') &&
                !url.pathname.startsWith('/auth/'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'edusmart-static-brand-images',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
    },
  };
});
