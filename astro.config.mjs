// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify'; // DODANE

// https://astro.build/config
export default defineConfig({
  site: 'https://airtur.pl',
  
  // KLUCZOWE: Zmieniamy tryb na serwerowy, żeby API działało
  output: 'server', 
  adapter: netlify(), 

  trailingSlash: 'always',
  build: {
    format: 'directory'
  },
  integrations: [
    sitemap()
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});