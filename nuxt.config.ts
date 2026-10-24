// https://nuxt.com/docs/api/configuration/nuxt-config
import { cp } from 'node:fs/promises'
import { join } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/tailwindcss'],
  // Configuração do banco MariaDB (docs/02 §3.1) — lida de DB_* no .env.
  runtimeConfig: {
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: Number(process.env.DB_PORT || 3306),
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'publications',
    // Pool (change paginacao-server-side-e-performance): limites ajustáveis por env.
    dbPoolLimit: process.env.DB_POOL_LIMIT || '',
    dbPoolQueueLimit: process.env.DB_POOL_QUEUE_LIMIT || '',
    // Autenticação (change auth-backend-resend): segredo HS256 do access JWT
    // (obrigatório — server/plugins/auth-config.ts falha no boot sem ele) e
    // Resend (server/utils/mailer.ts). Nunca expostos ao cliente (fora de `public`).
    authJwtSecret: process.env.AUTH_JWT_SECRET || '',
    // Cifra de segredos em repouso (senha SMTP) — change endurecer-sessao-
    // segredos-e-uploads. Obrigatório no boot (server/plugins/auth-config.ts).
    smtpEncKey: process.env.SMTP_ENC_KEY || '',
    // Origem dos links de e-mail (convite/recuperação) — não usa o Host recebido.
    appUrl: process.env.APP_URL || '',
    // Lista de proxies confiáveis (IPs/CIDRs separados por vírgula) — vazia =
    // nenhum: o X-Forwarded-For é ignorado e vale o IP da conexão.
    trustedProxies: process.env.TRUSTED_PROXIES || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    mailFrom: process.env.MAIL_FROM || '',
    // Sobrescrita por NUXT_DB_* se necessária; DB_* é a interface principal.
    public: {}
  },
  // Serviço de uploads + cópia das migrations no build.
  // Uploads: pasta uploads/ na raiz (gitignored; .gitkeep mantém a estrutura),
  // servida em runtime via publicAssets — funciona em dev e produção, ao
  // contrário de public/uploads/ (copiada só no build). Nitro 2.13: fonte das
  // migrations = <rootDir>/server/migration; destino = nitro.options.output.serverDir.
  nitro: {
    // Servimento dos uploads com nosniff (RL02 A-02): o navegador não adivinha
    // o tipo do arquivo — defesa extra contra conteúdo interpretado (HTML/SVG).
    compressPublicAssets: true,
    routeRules: {
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          Vary: 'Accept-Encoding'
        }
      },
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
          'X-Frame-Options': 'DENY'
        }
      },
      '/uploads/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          // RL04-C-01 (defesa em profundidade): mesmo que um arquivo executável
          // escape, o navegador não executa script na origem da aplicação.
          'Content-Security-Policy': "default-src 'none'; sandbox"
        }
      }
    },
    // RL06-C-01: somente os destinos de identidade são estáticos públicos.
    // Chamadas são servidas por server/routes/uploads/chamadas/[...arquivo].get.ts,
    // que aplica sessão + RBAC ou o gate de conteúdo publicado.
    publicAssets: [
      {
        baseURL: '/uploads/logomarcas',
        dir: join(process.cwd(), 'uploads', 'logomarcas')
      },
      {
        baseURL: '/uploads/avatares',
        dir: join(process.cwd(), 'uploads', 'avatares')
      },
      {
        baseURL: '/uploads/logos',
        dir: join(process.cwd(), 'uploads', 'logos')
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
    // @ts-expect-error — Nuxt aceita `loadingIndicator` no runtime; o tipo desta versão o omite.
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