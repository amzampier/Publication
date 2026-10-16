<script setup lang="ts">
// Primeiro acesso (change endurecer-banco-e-bootstrap): tela sem shell (layout
// de autenticação) onde o usuário com senha provisória define a nova senha
// antes de usar a Área Administrativa.
definePageMeta({ layout: 'auth' })
</script>

<template>
  <AuthPrimeiroAcessoForm />
</template>
