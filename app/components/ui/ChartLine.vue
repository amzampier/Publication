<script setup lang="ts">
import { computed } from 'vue'

export interface SerieLinha {
  nome: string
  cor: string
  valores: number[]
}

interface Props {
  titulo: string
  descricao?: string
  rotulo: string
  categorias: string[]
  series: SerieLinha[]
  sufixo?: string
  vazio?: string
}

const props = withDefaults(defineProps<Props>(), {
  descricao: '',
  sufixo: '',
  vazio: 'Sem dados no período.'
})

const largura = 600
const margem = 12
const topo = 10
const base = 196
const alturaUtil = base - topo

const maximo = computed(() => {
  let maior = 0
  for (const serie of props.series) {
    for (const valor of serie.valores) maior = Math.max(maior, valor)
  }
  return Math.max(1, maior)
})

const temDados = computed(() =>
  props.series.some((serie) => serie.valores.some((valor) => valor > 0))
)

const ariaLabel = computed(() => {
  if (!temDados.value) return `${props.rotulo}: ${props.vazio}`
  const totais = props.series
    .map((serie) => `${serie.nome}: ${serie.valores.reduce((soma, valor) => soma + valor, 0)}`)
    .join('; ')
  return `${props.rotulo}. ${totais}. Meses: ${props.categorias.join(', ')}.`
})

const posicaoX = (indice: number): number => {
  const total = props.categorias.length
  if (total <= 1) return largura / 2
  return margem + (indice * (largura - margem * 2)) / (total - 1)
}

const posicaoY = (valor: number): number =>
  base - (Math.max(0, valor) / maximo.value) * alturaUtil

const pontos = (serie: SerieLinha): string =>
  serie.valores
    .map((valor, indice) => `${posicaoX(indice)},${posicaoY(valor)}`)
    .join(' ')

const linhasGrade = [0, 0.5, 1].map((fracao) => base - fracao * alturaUtil)
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
    <header>
      <h3 class="text-sm font-bold text-slate-900">{{ titulo }}</h3>
      <p v-if="descricao" class="mt-0.5 text-[11px] text-slate-500">{{ descricao }}</p>
    </header>

    <p v-if="!temDados" class="mt-6 rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500">
      {{ vazio }}
    </p>

    <template v-else>
      <div class="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>Máx. {{ maximo }}</span>
        <span>12 meses</span>
      </div>

      <svg
        :viewBox="`0 0 ${largura} 210`"
        class="mt-1 h-auto w-full"
        role="img"
        :aria-label="ariaLabel"
      >
        <line
          v-for="(y, indice) in linhasGrade"
          :key="`grade-${indice}`"
          :x1="margem"
          :x2="largura - margem"
          :y1="y"
          :y2="y"
          stroke="#e2e8f0"
          stroke-width="1"
        />
        <g v-for="serie in series" :key="serie.nome">
          <polyline
            :points="pontos(serie)"
            fill="none"
            :stroke="serie.cor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            v-for="(valor, indice) in serie.valores"
            :key="`${serie.nome}-${indice}`"
            :cx="posicaoX(indice)"
            :cy="posicaoY(valor)"
            r="3.2"
            :fill="serie.cor"
            stroke="#fff"
            stroke-width="1.2"
          >
            <title>{{ categorias[indice] }} — {{ serie.nome }}: {{ valor }}{{ sufixo }}</title>
          </circle>
        </g>
      </svg>

      <div class="mt-1 flex gap-1 text-center text-[9px] text-slate-500">
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
