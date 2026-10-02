/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#112051',
          structure: '#0364f7',
          accent: '#4ed813',
          'primary-raised': '#1b2e6b',
          // Foco canônico dos controles (docs §2.2) — não confundir com accent.
          focus: '#1a9e07',
        },
      },
      fontFamily: {
        // Fontes oficiais do design system (docs/01 §1) — carregadas via
        // app.head.link no nuxt.config.ts; o preflight aplica `sans` no html.
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
