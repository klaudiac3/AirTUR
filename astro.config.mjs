// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://airtur.pl',
  
  // SENIOR TIP: Wymuszamy spójność adresów URL. 
  // Netlify domyślnie preferuje strukturę folderów, więc '/' na końcu jest najbardziej naturalne.
  trailingSlash: 'always',

  // Wymusza generowanie adresów bez .html (czyste linki)
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