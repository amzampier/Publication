<script setup lang="ts">
// Shell das telas de autenticação (/admin/login e /admin/esqueci-senha) —
// as únicas rotas sob /admin/** sem o shell header+sidebar (spec `login`; a
// exceção está formalizada em design-system/layout-navigation como "layout
// próprio" das telas de autenticação). Dono da composição canônica (fundo,
// card, identidade e divisor) e da hidratação da identidade do login: sem o
// await aqui, a logomarca de Configurações > Logomarcas só aparecia após
// passar por uma rota /admin/** com shell na mesma sessão SPA — o useState de
// useLogomarcaLogin inicia vazio em acesso direto/F5 (bug fechado por este
// layout). Usa o endpoint público mínimo GET /api/configuracoes/identidade
// (o GET completo de configurações exige sessão — auth-api.ts); o catch
// interno do loader mantém a marca padrão quando o GET falha.
// Todas as chamadas de composable (useState) ANTES do primeiro await — após
// await o contexto Nuxt se perde no SSR (NUXT_E1001) e o estado não hidrata
// no HTML. Mesma fonte usada por Configurações > Logomarcas e pelo AppHeader.
const { preview: logoPreview, caminho: logoCaminho } = useLogomarcaLogin()
const logo = computed(() => logoPreview.value || logoCaminho.value)

await carregarIdentidadeLogin()
</script>

<template>
  <div class="relative min-h-dvh overflow-hidden bg-[#070d22]">
    <AuthBackground />

    <div class="relative z-10 flex min-h-dvh items-center justify-center p-6">
      <div class="w-full max-w-xs rounded-xl bg-white p-8 shadow-lg">
        <AuthLoginHeader
          class="mb-4"
          :logo="logo"
        />

        <!-- Divisor brand-focus (#1a9e07) entre identidade e formulário. -->
        <div
          class="mb-4 h-px bg-brand-focus"
          role="separator"
        />

        <slot />
      </div>
    </div>
  </div>
</template>
