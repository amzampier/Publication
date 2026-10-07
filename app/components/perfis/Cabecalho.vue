<script setup lang="ts">
import { ShieldCheck, Plus } from '@lucide/vue'

// Abre o modal de perfil em modo de criação (coordenação na página, fase 2)
const emit = defineEmits<{
  (e: 'novo'): void
}>()
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#f5b302]">
        <ShieldCheck class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">
          Perfis de Acesso (RBAC)
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Administração dos perfis de acesso — permissões por módulo, usuários vinculados e status.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <UiButton
        variant="primary"
        size="md"
        class="w-full sm:w-auto"
        @click="emit('novo')"
      >
        <template #leftIcon><Plus class="h-4 w-4" /></template>
        Novo Perfil
      </UiButton>
    </div>
  </header>
</template>
