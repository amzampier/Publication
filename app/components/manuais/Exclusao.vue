<script setup lang="ts">
// Confirmação de exclusão definitiva — só é aberta quando o catálogo não está
// arquivado e não possui itens/relacionamentos (a página aplica a guarda).
import { AlertTriangle, BookOpen, Trash2 } from '@lucide/vue'
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
    title="Excluir Manual"
    subtitle="Confirme a exclusão definitiva do catálogo"
    :icon="Trash2"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Este manual será excluído" :icon="BookOpen">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ manual?.codigo }}</span>
          - {{ manual?.titulo }}
        </p>
        <p class="text-xs text-slate-600">Mês/Ano: {{ manual?.mesAno }}</p>
        <p class="text-xs text-slate-600">Itens vinculados: {{ manual?.itensCount ?? 0 }}</p>
      </div>
      <p class="flex items-start gap-2 text-xs text-rose-700">
        <AlertTriangle class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Esta ação não pode ser desfeita. Só é permitida para catálogos não arquivados e sem
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
