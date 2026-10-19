<script setup lang="ts">
// Confirmação de exclusão definitiva — só é aberta quando a release não está
// arquivada e não possui itens/relacionamentos (a página aplica a guarda).
import { AlertTriangle, Rocket, Trash2 } from '@lucide/vue'
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
    title="Excluir Release Week"
    subtitle="Confirme a exclusão definitiva da release"
    :icon="Trash2"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Esta release será excluída" :icon="Rocket">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ release?.codigo }}</span>
          - {{ release?.nome }}
        </p>
        <p class="text-xs text-slate-600">Período: {{ release?.periodo }}</p>
        <p class="text-xs text-slate-600">Itens vinculados: {{ release?.itensCount ?? 0 }}</p>
      </div>
      <p class="flex items-start gap-2 text-xs text-rose-700">
        <AlertTriangle class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Esta ação não pode ser desfeita. Só é permitida para releases não arquivadas e sem
          itens/relacionamentos.
        </span>
      </p>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="danger" size="md" @click="emit('confirmar')">
        <template #leftIcon><Trash2 class="h-3.5 w-3.5" /></template>
        Excluir
      </UiButton>
    </template>
  </UiModal>
</template>
