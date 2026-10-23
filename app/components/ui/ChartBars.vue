<script setup lang="ts">
import { computed } from 'vue'

export interface SerieBarras {
  nome: string
  cor: string
  valores: number[]
}

interface Props {
  titulo: string
  descricao?: string
  rotulo: string
  categorias: string[]
  series: SerieBarras[]
  altura?: number
  sufixo?: string
  vazio?: string
}

const props = withDefaults(defineProps<Props>(), {
  descricao: '',
  altura: 220,
  sufixo: '',
  vazio: 'Sem dados no período.'
})

const totais = computed(() =>
  props.categorias.map((_, indice) =>
    props.series.reduce((soma, serie) => soma + (serie.valores[indice] ?? 0), 0)
  )
)

const maximo = computed(() => Math.max(1, ...totais.value))
const temDados = computed(() => totais.value.some((total) => total > 0))

const ariaLabel = computed(() => {
  if (!temDados.value) return `${props.rotulo}: ${props.vazio}`
  const totaisSeries = props.series
    .map((serie) => `${serie.nome}: ${serie.valores.reduce((soma, valor) => soma + valor, 0)}`)
    .join('; ')
  return `${props.rotulo}. ${totaisSeries}. Categorias: ${props.categorias.join(', ')}.`
})

const alturaSegmento = (valor: number): string => {
  if (valor <= 0) return '0%'
  return `${Math.max((valor / maximo.value) * 100, 2)}%`
}

const tituloSegmento = (categoria: string, serie: SerieBarras, valor: number): string =>
  `${categoria} — ${serie.nome}: ${valor}${props.sufixo}`
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
    <header class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <h3 class="text-sm font-bold text-slate-900">{{ titulo }}</h3>
        <p v-if="descricao" class="mt-0.5 text-[11px] text-slate-500">{{ descricao }}</p>
      </div>
      <slot name="actions" />
    </header>

    <p v-if="!temDados" class="mt-6 rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500">
      {{ vazio }}
    </p>

    <template v-else>
      <div class="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>Máx. {{ maximo }}</span>
        <span>{{ totais.reduce((soma, total) => soma + total, 0) }}{{ sufixo }} no total</span>
      </div>

      <div
        class="mt-1 flex items-end gap-1"
        :style="{ height: `${altura}px` }"
        role="img"
        :aria-label="ariaLabel"
      >
        <div
          v-for="(categoria, indice) in categorias"
          :key="categoria"
          class="flex h-full min-w-0 flex-1 flex-col justify-end gap-0.5"
        >
          <div
            v-for="serie in series"
            :key="`${serie.nome}-${categoria}`"
            class="w-full rounded-t-[2px] transition-all"
            :style="{
              height: alturaSegmento(serie.valores[indice] ?? 0),
              backgroundColor: serie.cor
            }"
            :title="tituloSegmento(categoria, serie, serie.valores[indice] ?? 0)"
          ></div>
        </div>
      </div>

      <div class="mt-1.5 flex gap-1 text-center text-[9px] text-slate-500">
        <span v-for="categoria in categorias" :key="`label-${categoria}`" class="min-w-0 flex-1 truncate">
          {{ categoria }}
        </span>
      </div>

      <ul class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label="Legenda">
        <li v-for="serie in series" :key="`legenda-${serie.nome}`" class="flex items-center gap-1.5 text-[10px] text-slate-600">
          <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: serie.cor }" aria-hidden="true"></span>
          {{ serie.nome }}
        </li>
      </ul>
    </template>
  </section>
</template>
