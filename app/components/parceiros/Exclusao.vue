<script setup lang="ts">
// Modal de confirmação da exclusão de parceiro (apresentação pura — a página é
// dona do estado e da gravação): reutiliza UiModal/UiModalSection e emite apenas
// update:modelValue e confirmar.
import { computed } from 'vue'
import { AlertTriangle, Handshake, Trash2 } from '@lucide/vue'
import { type ParceiroModelo } from './useParceirosModelo'

interface Props {
  modelValue: boolean
  parceiro: ParceiroModelo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmar'): void
}>()

const cancelar = () => emit('update:modelValue', false)

const localizacao = computed(() => {
  const p = props.parceiro
  if (!p) return '—'
  return [p.cidade, p.estado].filter(Boolean).join(' - ') || '—'
})
</script>

<template>
  <UiModal
    :model-value="modelValue"
    title="Excluir Parceiro"
    subtitle="Confirme a exclusão definitiva do parceiro"
    :icon="Trash2"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Este parceiro será excluído" :icon="Handshake">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ parceiro?.codigo }}</span>
          - {{ parceiro?.razao_social }}
        </p>
        <p class="text-sm font-medium text-slate-900">
          Localização:
          <span class="font-normal text-slate-700">{{ localizacao }}</span>
        </p>
        <p class="text-sm font-medium text-slate-900">
          Situação:
          <span class="font-normal text-slate-700">{{ parceiro?.situacao }}</span>
        </p>
      </div>
      <p class="flex items-start gap-2 text-xs text-rose-700">
        <AlertTriangle class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Esta ação não pode ser desfeita: o parceiro será removido definitivamente da base de dados.
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
