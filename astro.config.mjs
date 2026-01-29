// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Adres Twojej strony - niezbędny do poprawnego generowania sitemapy i linków kanonicznych
  site: 'https://airtur.pl',
  
  integrations: [
    sitemap() // Automatyczna generacja mapy strony dla Google
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});