<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ShieldCheck } from '@lucide/vue'
import { validarParecer } from '#shared/esteira-revisao'
import {
  motivoBloqueioAprovacao,
  type ChamadaModelo
} from './validadores'

interface Props {
  modelValue: boolean
  chamada?: ChamadaModelo | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  chamada: null,
  loading: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
  (e: 'confirmar', payload: { parecer: string; criterios: boolean }): void
}>()

const parecer = ref('')
const criterios = ref(true)
const tentou = ref(false)

const motivo = computed(() =>
  props.chamada ? motivoBloqueioAprovacao(props.chamada) : 'Chamada não encontrada.'
)

const erroParecer = computed(() =>
  tentou.value ? validarParecer('aprovar', parecer.value) : null
)

const podeConfirmar = computed(
  () =>
    motivo.value === null &&
    criterios.value &&
    validarParecer('aprovar', parecer.value) === null
)

watch(
  () => [props.modelValue, props.chamada?.id] as const,
  ([aberto]) => {
    if (!aberto) return
    parecer.value = ''
    criterios.value = true
    tentou.value = false
  },
  { immediate: true }
)

const cancelar = () => emit('update:modelValue', false)

const confirmar = () => {
  tentou.value = true
  if (!podeConfirmar.value) return
  emit('confirmar', { parecer: parecer.value.trim(), criterios: criterios.value })
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

      <UiCheckbox
        v-model="criterios"
        label="Confirmo que os critérios de aceite foram atendidos"
        description="O histórico registrará os critérios como atendidos."
      />

      <UiTextarea
        v-model="parecer"
        label="Parecer (opcional)"
        placeholder="Observações da revisão..."
        :rows="3"
        :error="erroParecer ?? ''"
      />

      <p v-if="motivo" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        {{ motivo }}
      </p>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" :disabled="!podeConfirmar || loading" :loading="loading"
        @click="confirmar">
        <template #leftIcon><ShieldCheck class="h-4 w-4" /></template>
        Aprovar
      </UiButton>
    </template>
  </UiModal>
</template>
