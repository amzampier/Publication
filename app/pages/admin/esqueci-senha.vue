<script setup lang="ts">
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'

// Telas de autenticação ficam fora do shell header+sidebar (spec `login`;
// exceção de shell = /admin/login e /admin/esqueci-senha, delta de
// design-system/layout-navigation).
definePageMeta({ layout: false })

// Mesma fonte usada por Configurações > Logomarcas e pelo login (docs/04).
const { preview: logoPreview, caminho: logoCaminho } = useLogomarcaLogin()

const logo = computed(() => logoPreview.value || logoCaminho.value)
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

        <AuthForgotForm />
      </div>
    </div>
  </div>
</template>
