<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Trash2 } from '@lucide/vue'
import { motivoBloqueioExclusao, type ChamadaModelo } from './validadores'

interface Props {
  modelValue: boolean
  chamada?: ChamadaModelo | null
}

const props = withDefaults(defineProps<Props>(), {
  chamada: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
  (e: 'confirmar'): void
}>()

const motivo = computed(() =>
  props.chamada ? motivoBloqueioExclusao(props.chamada) : 'Chamada não encontrada.'
)

const cancelar = () => emit('update:modelValue', false)

const confirmar = () => {
  if (motivo.value) return
  emit('confirmar')
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="sm"
    title="Excluir chamada"
    subtitle="Esta ação é irreversível."
    :icon="Trash2"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Confirmação de exclusão" :icon="AlertTriangle">
      <p class="text-sm text-slate-700">
        A chamada
        <span class="font-mono font-semibold tabular-nums">{{ chamada?.chamada }}</span>
        será removida definitivamente do conjunto.
      </p>
      <p class="text-sm font-medium text-slate-900">{{ chamada?.titulo }}</p>

      <p
        v-if="motivo"
        class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
      >
        {{ motivo }}
      </p>
      <p v-else class="text-xs text-slate-500">
        A chamada sai da listagem e os indicadores são recalculados.
      </p>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="danger" :disabled="Boolean(motivo)" @click="confirmar">
        <template #leftIcon><Trash2 class="h-4 w-4" /></template>
        Excluir
      </UiButton>
    </template>
  </UiModal>
</template>
