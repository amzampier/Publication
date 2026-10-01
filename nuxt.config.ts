// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  // O default do módulo é `assets/css/tailwind.css` (caminho da era Nuxt 3),
  // que não existe aqui — sem isto a folha do projeto nunca é servida.
  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  }
})