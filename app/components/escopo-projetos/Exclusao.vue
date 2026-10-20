<script setup lang="ts">
// Confirmação de exclusão definitiva — só é aberta quando o escopo não está
// arquivado e não possui itens vinculados (a página e o card aplicam a guarda).
import { AlertTriangle, ClipboardList, Trash2 } from '@lucide/vue'
import {
  softwaresTexto,
  type ProjetoEscopoModelo
} from './useEscopoProjetosModelo'

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
    title="Excluir Escopo"
    subtitle="Confirme a exclusão definitiva do escopo"
    :icon="Trash2"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Este escopo será excluído" :icon="ClipboardList">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ escopo?.codigo }}</span>
          - {{ escopo?.nome }}
        </p>
        <p class="text-xs text-slate-600">Versão: {{ escopo?.versao }} · Ano: {{ escopo?.ano }}</p>
        <p
          v-if="escopo?.softwaresContemplados.length"
          class="text-xs text-slate-600"
        >
          Softwares: {{ softwaresTexto(escopo.softwaresContemplados) }}
        </p>
        <p class="text-xs text-slate-600">Itens vinculados: {{ escopo?.itensCount ?? 0 }}</p>
      </div>
      <p class="flex items-start gap-2 text-xs text-rose-700">
        <AlertTriangle class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Esta ação não pode ser desfeita. Só é permitida para escopos não arquivados e sem itens
          vinculados.
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
