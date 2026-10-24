<script setup lang="ts">
import { Workflow } from '@lucide/vue'
</script>

<template>
  <header class="flex min-w-0 items-start gap-3">
    <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-brand-accent">
      <Workflow class="h-5 w-5" aria-hidden="true" />
    </div>
    <div class="min-w-0">
      <h1 class="text-lg font-bold tracking-tight text-slate-900">Esteira de Revisão</h1>
      <p class="mt-1 max-w-3xl text-xs text-slate-500">
        Faça a conferência de chamadas técnicas, releases vinculadas e evidências de forma
        visual e ágil. Acompanhe o fluxo de
        <strong class="font-semibold text-slate-700">1. Revisar → 2. Aprovado → 3. Publicar/Publicado</strong>
        para Releases Week, Manuais e Projetos de Escopo.
      </p>
    </div>
  </header>
</template>
