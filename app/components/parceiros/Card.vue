<script setup lang="ts">
import { computed } from 'vue'
import { Map, MapPin, Handshake, Pencil, Trash2 } from '@lucide/vue'
import { VARIANTE_POR_SITUACAO, type ParceiroModelo } from './useParceirosModelo'

const props = defineProps<{ parceiro: ParceiroModelo }>()

const emit = defineEmits<{
  (e: 'editar', parceiro: ParceiroModelo): void
  (e: 'excluir', parceiro: ParceiroModelo): void
}>()

const localizacao = computed(
  () => [props.parceiro.cidade, props.parceiro.estado].filter(Boolean).join(' - ') || '—'
)

const linhas = computed(() => [
  { rotulo: 'Localização', valor: localizacao.value, icone: MapPin },
  { rotulo: 'Região', valor: props.parceiro.regiao || '—', icone: Map }
])
</script>

<template>
  <UiEntityCard
    :codigo="parceiro.codigo"
    :badge="{ label: parceiro.situacao, variant: VARIANTE_POR_SITUACAO[parceiro.situacao] }"
    :icone="Handshake"
    :titulo="parceiro.razao_social"
    :subtitulo="parceiro.nome_fantasia"
    :linhas="linhas"
  >
    <template #acoes>
      <UiTooltip content="Editar parceiro" position="top">
        <button
          type="button"
          :aria-label="`Editar ${parceiro.razao_social}`"
          class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-lime-50 hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
          @click="emit('editar', parceiro)"
        >
          <Pencil class="h-3.5 w-3.5" />
        </button>
      </UiTooltip>

      <UiTooltip content="Excluir parceiro" position="top">
        <button
          type="button"
          :aria-label="`Excluir ${parceiro.razao_social}`"
          class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
          @click="emit('excluir', parceiro)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </UiTooltip>
    </template>
  </UiEntityCard>
</template>
