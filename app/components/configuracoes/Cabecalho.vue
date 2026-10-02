<script setup lang="ts">
import { Save, Settings } from '@lucide/vue'

withDefaults(
  defineProps<{
    desabilitado?: boolean
  }>(),
  { desabilitado: false }
)

defineEmits<{
  (e: 'salvar'): void
}>()
</script>

<template>
  <!-- Cabeçalho da tela: sem container (conteúdo direto sobre o fundo da página) -->
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-brand-accent">
        <Settings class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">
          Configurações Globais do Sistema
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Parâmetros para identidade visual, retenção de auditoria,
          estrutura do menu e segurança.
        </p>
      </div>
    </div>

    <UiButton
      variant="primary"
      size="md"
      class="shrink-0 w-full sm:w-auto"
      :disabled="desabilitado"
      @click="$emit('salvar')"
    >
      <template #leftIcon><Save class="h-4 w-4 text-brand-accent" /></template>
      Salvar Alterações Globais
    </UiButton>
  </header>
</template>
