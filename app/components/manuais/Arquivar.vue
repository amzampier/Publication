<script setup lang="ts">
// Confirmação de arquivamento (soft): o catálogo sai da listagem, mas os dados
// e itens permanecem intactos e o catálogo não pode ser excluído depois.
import { Archive, Info } from '@lucide/vue'
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
    title="Arquivar Manual"
    subtitle="O catálogo deixará de aparecer na listagem"
    :icon="Archive"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Manual que será arquivado" :icon="Archive">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ manual?.codigo }}</span>
          - {{ manual?.titulo }}
        </p>
        <p class="text-xs text-slate-600">Mês/Ano: {{ manual?.mesAno }}</p>
        <p class="text-xs text-slate-600">Status: {{ manual?.status }}</p>
      </div>
      <p class="flex items-start gap-2 text-xs text-slate-600">
        <Info class="h-3.5 w-3.5 shrink-0 mt-px text-brand-structure" aria-hidden="true" />
        <span>
          O catálogo arquivado deixa de aparecer na listagem e nos KPIs, mas nenhum dado é
          apagado. Catálogos arquivados não podem ser excluídos.
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
