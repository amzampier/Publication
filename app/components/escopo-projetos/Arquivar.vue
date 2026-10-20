<script setup lang="ts">
// Confirmação de arquivamento (soft): o escopo sai da listagem e dos KPIs, mas
// os dados e itens permanecem intactos; escopos arquivados não podem ser
// excluídos. Na fase frontend a marca `arquivada` vive só em memória.
import { Archive, ClipboardList, Info } from '@lucide/vue'
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
    title="Arquivar Escopo"
    subtitle="O escopo deixará de aparecer na listagem"
    :icon="Archive"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Escopo que será arquivado" :icon="ClipboardList">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ escopo?.codigo }}</span>
          - {{ escopo?.nome }}
        </p>
        <p class="text-xs text-slate-600">Versão: {{ escopo?.versao }}</p>
        <p class="text-xs text-slate-600">Status: {{ escopo?.status }}</p>
      </div>
      <p class="flex items-start gap-2 text-xs text-slate-600">
        <Info class="h-3.5 w-3.5 shrink-0 mt-px text-brand-structure" aria-hidden="true" />
        <span>
          O escopo arquivado deixa de aparecer na listagem e nos KPIs, mas nenhum dado é apagado.
          Escopos arquivados não podem ser excluídos.
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
