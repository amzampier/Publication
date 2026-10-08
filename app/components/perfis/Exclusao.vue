<script setup lang="ts">
// Modal de confirmação da exclusão de perfil (apresentação pura - a página é dona do
// estado e da gravação, como no modal de usuários): reutiliza UiModal/UiModalSection
// e emite apenas update:modelValue e confirmar.
import { AlertTriangle, ShieldX, Trash2 } from '@lucide/vue'
import type { LinhaPerfil } from './usePerfisDemo'

interface Props {
  modelValue: boolean
  perfil: LinhaPerfil | null
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
    title="Excluir Perfil"
    subtitle="Confirme a exclusão do perfil da base em memória"
    :icon="Trash2"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Este perfil será excluído" :icon="ShieldX">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          {{ perfil?.nome }}
        </p>
        <p class="text-sm font-medium text-slate-900">
          Usuários Vinculados:
          <span class="font-mono tabular-nums">{{ perfil?.usuarios ?? 0 }}</span>
        </p>
      </div>
      <p class="flex items-start gap-2 text-xs text-rose-700">
        <AlertTriangle class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Esta ação não pode ser desfeita: o perfil sai da base em memória e
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
