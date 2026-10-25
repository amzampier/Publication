<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { XCircle } from '@lucide/vue'
import { validarParecer } from '#shared/esteira-revisao'
import {
  motivoBloqueioRecusa,
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
const tentou = ref(false)
const parecerRef = ref<{ focar: () => void } | null>(null)

const motivo = computed(() =>
  props.chamada ? motivoBloqueioRecusa(props.chamada) : 'Chamada não encontrada.'
)

const erroParecer = computed(() =>
  tentou.value ? validarParecer('recusar', parecer.value) : null
)

const podeConfirmar = computed(
  () => motivo.value === null && validarParecer('recusar', parecer.value) === null
)

watch(
  () => [props.modelValue, props.chamada?.id] as const,
  ([aberto]) => {
    if (!aberto) return
    parecer.value = ''
    tentou.value = false
  },
  { immediate: true }
)

const cancelar = () => emit('update:modelValue', false)

const confirmar = () => {
  tentou.value = true
  if (!podeConfirmar.value) {
    if (parecer.value.trim() === '') nextTick(() => parecerRef.value?.focar())
    return
  }
  emit('confirmar', { parecer: parecer.value.trim(), criterios: false })
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

      <UiTextarea
        ref="parecerRef"
        v-model="parecer"
        label="Parecer da recusa (obrigatório)"
        placeholder="Descreva o motivo da recusa e o que precisa ser corrigido..."
        :rows="4"
        :error="erroParecer ?? ''"
      />

      <p v-if="motivo" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        {{ motivo }}
      </p>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" @click="cancelar">Cancelar</UiButton>
      <UiButton
        variant="danger"
        :disabled="motivo !== null || loading"
        :title="motivo ?? undefined"
        :loading="loading"
        @click="confirmar"
      >
        <template #leftIcon><XCircle class="h-4 w-4" /></template>
        Recusar
      </UiButton>
    </template>
  </UiModal>
</template>
