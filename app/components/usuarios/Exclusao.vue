<script setup lang="ts">
// Modal de confirmação da exclusão (apresentação pura - a página é dona do
// estado e da gravação, como no modal de cadastro): reutiliza UiModal/UiModalSection
// e emite apenas update:modelValue e confirmar.
import { AlertTriangle, Trash2, UserX } from '@lucide/vue'
import type { UsuarioDemo } from './useUsuariosDemo'

interface Props {
  modelValue: boolean
  usuario: UsuarioDemo | null
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
    title="Excluir Usuário"
    :icon="Trash2"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Este usuário será excluído" :icon="UserX">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          {{ usuario?.nome }}
        </p>
        <p class="text-sm font-medium text-slate-900 font-mono break-all">
          {{ usuario?.email }}
        </p>
      </div>
      <p class="flex items-start gap-2 text-xs text-rose-700">
        <AlertTriangle class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Esta ação não pode ser desfeita: o registro sai da base em memória e
          só volta na recarga da página.
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
