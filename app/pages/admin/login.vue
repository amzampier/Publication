<script setup lang="ts">
import { sanitizarRedirectAdmin, useAuth } from '../../composables/useAuth'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'

// Tela de login fica fora do shell header+sidebar (spec `login`; exceção
// formalizada no delta de design-system/layout-navigation).
definePageMeta({ layout: false })

const route = useRoute()
const { entrar } = useAuth()

// Mesma fonte usada por Configurações > Logomarcas e pelos relatórios (docs/04).
const { preview: logoPreview, caminho: logoCaminho } = useLogomarcaLogin()

const logo = computed(() => logoPreview.value || logoCaminho.value)
const carregando = ref(false)

const aoSubmeter = async (credenciais: { email: string; senha: string; lembrar: boolean }) => {
  if (carregando.value) return
  carregando.value = true

  const ok = entrar(credenciais)

  if (ok) {
    // ?redirect= sanitizado (só /admin..., sem //) ou /admin.
    await navigateTo(sanitizarRedirectAdmin(route.query.redirect))
  }

  carregando.value = false
}
</script>

<template>
  <div class="relative min-h-dvh overflow-hidden bg-[#070d22]">
    <AuthBackground />

    <div class="relative z-10 flex min-h-dvh items-center justify-center p-6">
      <div class="w-full max-w-xs rounded-xl bg-white p-8 shadow-lg">
        <AuthLoginHeader
          class="mb-4"
          subtitulo="Área Administrativa"
          :logo="logo"
        />

        <!-- Divisor brand-focus (#1a9e07) entre identidade e formulário. -->
        <div
          class="mb-4 h-px bg-brand-focus"
          role="separator"
        />

        <AuthLoginForm
          :loading="carregando"
          @submit="aoSubmeter"
        />
      </div>
    </div>
  </div>
</template>
