<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck } from '@lucide/vue'
import {
  motivoBloqueioAprovacao,
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
  props.chamada ? motivoBloqueioAprovacao(props.chamada) : 'Chamada não encontrada.'
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
    title="Aprovar chamada"
    subtitle="A chamada passa para o status Aprovado."
    :icon="ShieldCheck"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Confirmar aprovação" :icon="ShieldCheck">
      <p class="text-sm text-slate-700">
        A chamada
        <span class="font-mono font-semibold tabular-nums">{{ chamada?.chamada }}</span>
        será marcada como <strong>Aprovada</strong> e seguirá para a etapa seguinte do fluxo.
      </p>
      <p class="text-sm font-medium text-slate-900">{{ chamada?.titulo }}</p>
      <p v-if="motivo" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        {{ motivo }}
      </p>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" :disabled="Boolean(motivo)" @click="confirmar">
        <template #leftIcon><ShieldCheck class="h-4 w-4" /></template>
        Aprovar
      </UiButton>
    </template>
  </UiModal>
</template>
