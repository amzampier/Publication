<script setup lang="ts">
import { computed } from 'vue'
import { XCircle } from '@lucide/vue'
import {
  motivoBloqueioRecusa,
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
  (e: 'confirmar'): void
}>()

const motivo = computed(() =>
  props.chamada ? motivoBloqueioRecusa(props.chamada) : 'Chamada não encontrada.'
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
    title="Recusar chamada"
    subtitle="A chamada passa para o status Recusado."
    :icon="XCircle"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Confirmar recusa" :icon="XCircle">
      <p class="text-sm text-slate-700">
        A chamada
        <span class="font-mono font-semibold tabular-nums">{{ chamada?.chamada }}</span>
        será marcada como <strong>Recusada</strong> e sairá do fluxo de aprovação.
      </p>
      <p class="text-sm font-medium text-slate-900">{{ chamada?.titulo }}</p>
      <p v-if="motivo" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        {{ motivo }}
      </p>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="danger" :disabled="Boolean(motivo)" @click="confirmar">
        <template #leftIcon><XCircle class="h-4 w-4" /></template>
        Recusar
      </UiButton>
    </template>
  </UiModal>
</template>
