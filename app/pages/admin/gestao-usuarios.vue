<script setup lang="ts">
definePageMeta({ layout: 'admin' })
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl">
      <UsuariosCabecalho />

      <UsuariosKpis class="mt-6" />

      <UsuariosTabela class="mt-5" />
    </div>
  </div>
</template>
