import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Required headers for SharedArrayBuffer
// WARNING: Enabling COEP (even 'credentialless') will block third-party iframes 
// like YouTube unless they are explicitly marked with the `credentialless` attribute.
// Since the YouTube IFrame API creates the iframe dynamically, it gets blocked.
// We disable these headers so YouTube works on localhost.
const coopCoepHeaders = {
  // 'Cross-Origin-Opener-Policy': 'same-origin',
  // 'Cross-Origin-Embedder-Policy': 'credentialless',
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf,otf}'],
        globIgnores: ['**/*.{m3u8,ts,mp4,webm}'],
        navigateFallbackDenylist: [/^\/api/],

        // INCREASES LIMIT TO 5MB to allow landing-bg.png to be cached
        maximumFileSizeToCacheInBytes: 5242880
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    headers: coopCoepHeaders,
  },
  preview: {
    headers: coopCoepHeaders,
  },
  // Strip chatty logs from production. They were shipping to every visitor's
  // console — including resolved stream URLs (which carry provider tokens) and
  // internal provider/rotation details. console.warn and console.error are kept
  // so genuine failures are still reportable.
  esbuild: {
    pure: ['console.log', 'console.info', 'console.debug'],
  },
  build: {
    outDir: 'dist',
    // Source maps embed `sourcesContent` — the full original TypeScript, with
    // comments — and Vite appends a //# sourceMappingURL comment so anyone can
    // fetch it. With this on, /assets/*.js.map served 102 of our own source
    // files publicly. Keep production builds map-free.
    sourcemap: false,
  },
});