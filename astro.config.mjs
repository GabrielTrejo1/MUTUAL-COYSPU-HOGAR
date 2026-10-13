// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sanity from '@sanity/astro';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sanity({
    projectId: 'a0d3k51r', // Reemplaza esto con tu ID real
    dataset: 'production',
    useCdn: false, // Falso asegura que traiga los datos más recientes al construir
    apiVersion: '2026-10-12', // Pon la fecha de hoy
  })]
});