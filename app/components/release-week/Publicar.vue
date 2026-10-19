<script setup lang="ts">
// Confirmação de publicação: altera o status da release para "Publicado".
import { Send, Rocket } from '@lucide/vue'
import type { LinhaReleaseWeek } from './useReleaseWeekModelo'

interface Props {
  modelValue: boolean
  release: LinhaReleaseWeek | null
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
    title="Publicar Release Week"
    subtitle="O status da release passará para Publicado"
    :icon="Send"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Release que será publicada" :icon="Rocket">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ release?.codigo }}</span>
          - {{ release?.nome }}
        </p>
        <p class="text-xs text-slate-600">Período: {{ release?.periodo }}</p>
        <p class="text-xs text-slate-600">Status atual: {{ release?.status }}</p>
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
