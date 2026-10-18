<script setup lang="ts">
// Modal de confirmação da exclusão de software (apresentação pura — a página é
// dona do estado e da gravação, como nos demais módulos): reutiliza
// UiModal/UiModalSection e emite apenas update:modelValue e confirmar.
import { AlertTriangle, Boxes, Trash2 } from '@lucide/vue'
import type { LinhaSoftware } from './useSoftwaresModelo'

interface Props {
  modelValue: boolean
  software: LinhaSoftware | null
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
    title="Excluir Software"
    subtitle="Confirme a exclusão definitiva do software"
    :icon="Trash2"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Este software será excluído" :icon="Boxes">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          <span class="font-mono">{{ software?.codigo }}</span>
          - {{ software?.descricao }}
        </p>
        <p class="text-sm font-medium text-slate-900">
          Categoria:
          <span class="font-normal text-slate-700">{{ software?.categoria }}</span>
        </p>
      </div>
      <p class="flex items-start gap-2 text-xs text-rose-700">
        <AlertTriangle class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Esta ação não pode ser desfeita: o software será removido definitivamente
          da base de dados.
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
