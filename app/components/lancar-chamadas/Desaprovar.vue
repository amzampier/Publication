<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Undo2 } from '@lucide/vue'
import {
  motivoBloqueioDesaprovacao,
  type ChamadaModelo
} from './validadores'

interface Props {
  modelValue: boolean
  chamada?: ChamadaModelo | null
}

const props = withDefaults(defineProps<Props>(), {
  chamada: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
  (e: 'confirmar', payload: { parecer: string }): void
}>()

const parecer = ref('')

const motivo = computed(() =>
  props.chamada ? motivoBloqueioDesaprovacao(props.chamada) : 'Chamada não encontrada.'
)

watch(
  () => [props.modelValue, props.chamada?.id] as const,
  ([aberto]) => {
    if (aberto) parecer.value = ''
  },
  { immediate: true }
)

const cancelar = () => emit('update:modelValue', false)

const confirmar = () => {
  if (motivo.value) return
  emit('confirmar', { parecer: parecer.value.trim() })
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="sm"
    title="Desaprovar chamada"
    subtitle="A chamada volta para Revisar e a data de liberação é limpa."
    :icon="Undo2"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Confirmar desaprovação" :icon="Undo2">
      <p class="text-sm text-slate-700">
        A chamada
        <span class="font-mono font-semibold tabular-nums">{{ chamada?.chamada }}</span>
        voltará para <strong>Revisar</strong> para correção.
      </p>
      <p class="text-sm font-medium text-slate-900">{{ chamada?.titulo }}</p>

      <UiTextarea
        v-model="parecer"
        label="Parecer (opcional)"
        placeholder="Observações da reabertura..."
        :rows="3"
      />

      <p v-if="motivo" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        {{ motivo }}
      </p>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" :disabled="Boolean(motivo)" @click="confirmar">
        <template #leftIcon><Undo2 class="h-4 w-4" /></template>
        Desaprovar
      </UiButton>
    </template>
  </UiModal>
</template>
