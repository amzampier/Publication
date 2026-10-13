<script setup lang="ts">
import { User } from '@lucide/vue'
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start gap-3">
    <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#50a1ff]">
      <User class="h-5 w-5" aria-hidden="true" />
    </div>
    <div class="min-w-0">
      <h1 class="text-lg font-bold tracking-tight text-slate-900">Meu Perfil</h1>
      <p class="mt-1 text-xs text-slate-500">
        Gerencie suas informações e preferências
      </p>
    </div>
  </header>
</template>
