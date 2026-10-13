// https://nuxt.com/docs/api/configuration/nuxt-config
import { cp } from 'node:fs/promises'
import { join } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  // Configuração do banco MariaDB (docs/02 §3.1) — lida de DB_* no .env.
  runtimeConfig: {
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: Number(process.env.DB_PORT || 3306),
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'publications',
    // Sobrescrita por NUXT_DB_* se necessária; DB_* é a interface principal.
    public: {}
  },
  // Serviço de uploads + cópia das migrations no build.
  // Uploads: pasta uploads/ na raiz (gitignored; .gitkeep mantém a estrutura),
  // servida em runtime via publicAssets — funciona em dev e produção, ao
  // contrário de public/uploads/ (copiada só no build). Nitro 2.13: fonte das
  // migrations = <rootDir>/server/migration; destino = nitro.options.output.serverDir.
  nitro: {
    publicAssets: [
      {
        baseURL: '/uploads',
        dir: join(process.cwd(), 'uploads')
      }
    ],
    hooks: {
      compiled: async (nitro) => {
        const src = join(nitro.options.rootDir, 'server', 'migration')
        const dest = join(nitro.options.output.serverDir, 'migration')
        await cp(src, dest, { recursive: true })
      }
    }
  },
  // O default do módulo é `assets/css/tailwind.css` (caminho da era Nuxt 3),
  // que não existe aqui — sem isto a folha do projeto nunca é servida.
  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  },
  // Fontes oficiais do design system (docs/01 §1) — Plus Jakarta Sans + JetBrains Mono.
  app: {
    // Indicador de navegação lenta (MEL-04 do RL01) nas cores da marca — só aparece
    // quando a rota demorar (hoje raro: páginas em memória; preparação p/ listagens assíncronas).
    loadingIndicator: {
      name: 'circle',
      color: '#4ed813',
      background: '#112051'
    },
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