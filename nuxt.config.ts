// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  // O default do módulo é `assets/css/tailwind.css` (caminho da era Nuxt 3),
  // que não existe aqui — sem isto a folha do projeto nunca é servida.
  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  },
  // Fontes oficiais do design system (docs/01 §1) — Plus Jakarta Sans + JetBrains Mono.
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap'
        }
      ]
    }
  }
})