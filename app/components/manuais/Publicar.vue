<script setup lang="ts">
// Confirmação de publicação: altera o status do catálogo para "Publicado".
import { Send, BookOpen } from '@lucide/vue'
import type { LinhaManual } from './useManuaisModelo'

interface Props {
  modelValue: boolean
  manual: LinhaManual | null
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
    title="Publicar Manual"
    subtitle="O status do catálogo passará para Publicado"
    :icon="Send"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Manual que será publicado" :icon="BookOpen">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ manual?.codigo }}</span>
          - {{ manual?.titulo }}
        </p>
        <p class="text-xs text-slate-600">Mês/Ano: {{ manual?.mesAno }}</p>
        <p class="text-xs text-slate-600">Status atual: {{ manual?.status }}</p>
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
