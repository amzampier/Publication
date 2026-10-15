<script setup lang="ts">
// Telas de autenticação ficam fora do shell header+sidebar (spec `login`);
// a composição canônica (fundo, card, identidade e divisor) e a hidratação
// da logomarca são dono do layout `auth` (app/layouts/auth.vue).
definePageMeta({ layout: 'auth' })
</script>

<template>
  <AuthForgotForm />
</template>
