<script setup lang="ts">
// Confirmação de publicação: altera o status do escopo para "Publicado" e
// atualiza a data de publicação para hoje (dataset em memória).
import { Send, ClipboardList } from '@lucide/vue'
import type { ProjetoEscopoModelo } from './useEscopoProjetosModelo'

interface Props {
  modelValue: boolean
  escopo: ProjetoEscopoModelo | null
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmar'): void
}>()

const cancelar = () => emit('update:modelValue', false)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    title="Publicar Escopo"
    subtitle="O status do escopo passará para Publicado"
    :icon="Send"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Escopo que será publicado" :icon="ClipboardList">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ escopo?.codigo }}</span>
          - {{ escopo?.nome }}
        </p>
        <p class="text-xs text-slate-600">Versão: {{ escopo?.versao }}</p>
        <p class="text-xs text-slate-600">Ano: {{ escopo?.ano }}</p>
        <p class="text-xs text-slate-600">Status atual: {{ escopo?.status }}</p>
      </div>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" @click="emit('confirmar')">
        <template #leftIcon><Send class="h-3.5 w-3.5" /></template>
        Publicar
      </UiButton>
    </template>
  </UiModal>
</template>
