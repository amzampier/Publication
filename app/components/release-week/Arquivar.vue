<script setup lang="ts">
// Confirmação de arquivamento (soft): a release sai da listagem, mas os dados e
// itens permanecem intactos e a release não pode ser excluída depois.
import { Archive, Info } from '@lucide/vue'
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
    title="Arquivar Release Week"
    subtitle="A release deixará de aparecer na listagem"
    :icon="Archive"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Release que será arquivada" :icon="Archive">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ release?.codigo }}</span>
          - {{ release?.nome }}
        </p>
        <p class="text-xs text-slate-600">Período: {{ release?.periodo }}</p>
        <p class="text-xs text-slate-600">Status: {{ release?.status }}</p>
      </div>
      <p class="flex items-start gap-2 text-xs text-slate-600">
        <Info class="h-3.5 w-3.5 shrink-0 mt-px text-brand-structure" aria-hidden="true" />
        <span>
          A release arquivada deixa de aparecer na listagem e nos KPIs, mas nenhum dado é
          apagado. Releases arquivadas não podem ser excluídas.
        </span>
      </p>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" @click="emit('confirmar')">
        <template #leftIcon><Archive class="h-3.5 w-3.5" /></template>
        Arquivar
      </UiButton>
    </template>
  </UiModal>
</template>
