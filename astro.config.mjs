// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://airtur.pl',
  
  // ==========================================
  // 1. SEO & ROUTING
  // ==========================================
  // Wracamy do 'ignore'. Netlify "Pretty URLs" samo zadba o to, 
  // by Google nie widziało duplikatów, a nasze linki w menu nie wywalały błędu 404.
  trailingSlash: 'ignore', 
  build: {
    format: 'directory'
  },

  // ==========================================
  // 2. BACKEND & DEPLOYMENT
  // ==========================================
  output: 'server', 
  adapter: netlify(), 

  // ==========================================
  // 3. PERFORMANCE OPTIMIZATION
  // ==========================================
  compressHTML: true, 
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport', 
  },

  // ==========================================
  // 4. INTEGRATIONS
  // ==========================================
  integrations: [
    sitemap()
  ],

  // ==========================================
  // 5. BUNDLER (Vite)
  // ==========================================
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'esbuild',
      chunkSizeWarningLimit: 1500, 
    }
  }
});