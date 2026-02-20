// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://airtur.pl',
  
  // To zapewnia obsługę API w Node.js (działa z googleapis)
  output: 'server', 
  adapter: netlify(), 

  trailingSlash: 'ignore',
  
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