// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://airtur.pl',
  
  // DODAJ TO: Wymusza dodawanie ukośnika na końcu (np. /kontakt/) 
  // lub jego brak. Dla Netlify najbezpieczniej ustawić 'always'.
  trailingSlash: 'always',

  integrations: [
    sitemap()
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});