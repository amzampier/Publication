<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ArchiveRestore, ShieldCheck, Undo2, UploadCloud, XCircle } from '@lucide/vue'
import {
  validarParecer,
  type AcaoEsteira,
  type ItemEsteira
} from './validadores'

interface Props {
  modelValue: boolean
  item?: ItemEsteira | null
  acao: AcaoEsteira
}

const props = withDefaults(defineProps<Props>(), {
  item: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
  (
    e: 'confirmar',
    payload: { acao: AcaoEsteira; parecer: string; criterios: boolean }
  ): void
}>()

const parecer = ref('')
const criterios = ref(true)
const tentou = ref(false)
const parecerRef = ref<{ focar: () => void } | null>(null)

const configuracao = computed(() => {
  if (props.acao === 'aprovar') {
    return {
      titulo: 'Aprovar chamada',
      subtitulo: 'A chamada passa para Aprovado e segue no fluxo.',
      rotuloBotao: 'Aprovar',
      icone: ShieldCheck,
      variante: 'primary' as const
    }
  }
  if (props.acao === 'recusar') {
    return {
      titulo: 'Recusar chamada',
      subtitulo: 'A chamada passa para Recusado; o parecer é obrigatório.',
      rotuloBotao: 'Recusar',
      icone: XCircle,
      variante: 'danger' as const
    }
  }
  if (props.acao === 'publicar') {
    return {
      titulo: 'Publicar item',
      subtitulo: 'O item homologado ficará visível no portal público.',
      rotuloBotao: 'Publicar Item',
      icone: UploadCloud,
      variante: 'primary' as const
    }
  }
  if (props.acao === 'suspender') {
    return {
      titulo: 'Suspender para homologado',
      subtitulo: 'O item volta para Aprovado e deixa o portal público.',
      rotuloBotao: 'Suspender',
      icone: ArchiveRestore,
      variante: 'outline' as const
    }
  }
  return {
    titulo: 'Reabrir chamada',
    subtitulo: 'A chamada volta para Revisar e a data de liberação é limpa.',
    rotuloBotao: 'Reabrir',
    icone: Undo2,
    variante: 'primary' as const
  }
})

const erroParecer = computed(() =>
  tentou.value ? validarParecer(props.acao, parecer.value) : null
)

const podeConfirmar = computed(() => {
  if (props.acao === 'aprovar' && !criterios.value) return false
  return validarParecer(props.acao, parecer.value) === null
})

watch(
  () => [props.modelValue, props.acao, props.item?.id] as const,
  ([aberto]) => {
    if (!aberto) return
    parecer.value = ''
    criterios.value = props.acao === 'aprovar'
    tentou.value = false
  },
  { immediate: true }
)

const cancelar = () => emit('update:modelValue', false)

const confirmar = () => {
  tentou.value = true
  if (!podeConfirmar.value) {
    if (props.acao === 'recusar' && parecer.value.trim() === '') nextTick(() => parecerRef.value?.focar())
    return
  }
  emit('confirmar', {
    acao: props.acao,
    parecer: parecer.value.trim(),
    criterios: props.acao === 'aprovar' ? criterios.value : false
  })
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="sm"
    :title="configuracao.titulo"
    :subtitle="configuracao.subtitulo"
    :icon="configuracao.icone"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-3">
      <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p class="font-mono text-xs font-semibold tabular-nums text-slate-700">
          {{ item?.chamada ?? '—' }}
        </p>
        <p class="mt-0.5 text-sm font-medium text-slate-900">{{ item?.titulo ?? '' }}</p>
        <p class="mt-0.5 text-[11px] text-slate-500">Status atual: {{ item?.status ?? '—' }}</p>
      </div>

      <UiCheckbox
        v-if="acao === 'aprovar'"
        v-model="criterios"
        label="Confirmo que os critérios de aceite foram atendidos"
        description="O histórico registrará os critérios como atendidos."
      />

      <UiTextarea
        ref="parecerRef"
        v-model="parecer"
        :label="acao === 'recusar' ? 'Parecer da recusa (obrigatório)' : 'Parecer (opcional)'"
        :placeholder="
          acao === 'recusar'
            ? 'Descreva o motivo da recusa e o que precisa ser corrigido...'
            : 'Observações da revisão...'
        "
        :rows="4"
        :error="erroParecer ?? ''"
      />
    </div>

    <template #footer>
      <UiButton variant="outline" @click="cancelar">Cancelar</UiButton>
      <UiButton
        :variant="configuracao.variante"
        :disabled="acao === 'aprovar' && !criterios"
        @click="confirmar"
      >
        <template #leftIcon>
          <component :is="configuracao.icone" class="h-4 w-4" />
        </template>
        {{ configuracao.rotuloBotao }}
      </UiButton>
    </template>
  </UiModal>
</template>
