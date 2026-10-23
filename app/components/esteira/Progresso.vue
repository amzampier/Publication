<script setup lang="ts">
import { computed } from 'vue'
import { RotateCcw } from '@lucide/vue'
import { useEsteiraRevisaoModelo } from './useEsteiraRevisaoModelo'
import type { ProgressoEsteira } from './validadores'

interface Props {
  progresso: ProgressoEsteira
}

const props = defineProps<Props>()

const { mostrarRecusadas, alternarRecusadas } = useEsteiraRevisaoModelo()

const COR_APROVADO = '#1a9e07'
const COR_REVISAR = '#f59e0b'
const COR_RECUSADO = '#be123c'
const COR_PUBLICAR = '#0364f7'
const COR_PUBLICADO = '#112051'

const total = computed(() => props.progresso.total)
const vazio = computed(() => total.value === 0)

const segmento = (valor: number): string =>
  total.value > 0 ? `${(valor / total.value) * 100}%` : '0%'

const descricaoAcessivel = computed(
  () =>
    `${props.progresso.percentualRevisado}% do fluxo concluído. ` +
    `${props.progresso.revisar} a revisar, ${props.progresso.aprovado} aprovados, ` +
    `${props.progresso.aguardando} aguardando publicação, ` +
    `${props.progresso.publicado} no portal e ${props.progresso.recusado} recusados.`
)
</script>

<template>
  <article
    class="rounded-lg border border-slate-200 bg-white p-3 shadow-xs"
    aria-label="Progresso da Esteira"
  >
    <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div class="flex items-baseline gap-2">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Progresso
        </p>
        <p class="font-mono text-lg font-bold tabular-nums text-slate-900">
          {{ progresso.percentualRevisado }}%
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-slate-600">
        <span class="inline-flex items-center gap-1">
          <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: COR_REVISAR }" />
          {{ progresso.revisar }} a revisar
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: COR_APROVADO }" />
          {{ progresso.aprovado }} aprov.
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: COR_PUBLICAR }" />
          {{ progresso.aguardando }} aguard.
        </span>
        <span
          v-if="progresso.publicado"
          class="inline-flex items-center gap-1 text-slate-500"
        >
          <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: COR_PUBLICADO }" />
          {{ progresso.publicado }} no portal
        </span>
      </div>
    </div>

    <div
      v-if="vazio"
      class="mt-2 rounded border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-[10px] text-slate-500"
    >
      Nenhuma chamada no fluxo.
    </div>

    <div
      v-else
      class="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      :aria-valuenow="progresso.percentualRevisado"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="descricaoAcessivel"
    >
      <span
        v-if="progresso.revisar"
        :style="{ width: segmento(progresso.revisar), backgroundColor: COR_REVISAR }"
      />
      <span
        v-if="progresso.aprovado"
        :style="{ width: segmento(progresso.aprovado), backgroundColor: COR_APROVADO }"
      />
      <span
        v-if="progresso.publicar"
        :style="{ width: segmento(progresso.publicar), backgroundColor: COR_PUBLICAR }"
      />
      <span
        v-if="progresso.recusado"
        :style="{ width: segmento(progresso.recusado), backgroundColor: COR_RECUSADO }"
      />
    </div>

    <div class="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] text-slate-400">
      <span>{{ progresso.revisado }}/{{ progresso.total }} avançaram</span>
      <button
        v-if="progresso.recusado > 0"
        type="button"
        class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
        :class="
          mostrarRecusadas
            ? 'border-rose-300 bg-rose-50 text-rose-700'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-rose-200 hover:text-rose-700'
        "
        :aria-pressed="mostrarRecusadas"
        @click="alternarRecusadas"
      >
        <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: COR_RECUSADO }" />
        {{ progresso.recusado }} recusadas
        <RotateCcw v-if="mostrarRecusadas" class="h-2.5 w-2.5" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>
