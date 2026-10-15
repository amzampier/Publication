<script setup lang="ts">
import { sanitizarRedirectAdmin, useAuth } from '../../composables/useAuth'

// Tela de login fica fora do shell header+sidebar (spec `login`); a
// composição canônica (fundo, card, identidade e divisor) e a hidratação
// da logomarca são dono do layout `auth` (app/layouts/auth.vue).
definePageMeta({ layout: 'auth' })

const route = useRoute()
const { entrar } = useAuth()

const carregando = ref(false)

const aoSubmeter = async (credenciais: { email: string; senha: string; lembrar: boolean }) => {
  if (carregando.value) return
  carregando.value = true

  const ok = await entrar(credenciais)

  if (ok) {
    // ?redirect= sanitizado (só /admin..., sem //) ou /admin.
    await navigateTo(sanitizarRedirectAdmin(route.query.redirect))
  }

  carregando.value = false
}
</script>

<template>
  <AuthLoginForm
    :loading="carregando"
    @submit="aoSubmeter"
  />
</template>
