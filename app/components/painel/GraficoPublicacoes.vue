<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PontoSerieAnual, PontoSerieMensal } from '#shared/painel-executivo'

interface SerieGrafico {
  nome: string
  cor: string
  valores: number[]
}

interface Props {
  serieMensal: PontoSerieMensal[]
  serieAnual: PontoSerieAnual[]
}

const props = defineProps<Props>()
const modo = ref<'mensal' | 'anual'>('mensal')

const opcoesModo = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' }
]

const categoriasMensais = computed(() => props.serieMensal.map((ponto) => ponto.rotulo))
const categoriasAnuais = computed(() => props.serieAnual.map((ponto) => String(ponto.ano)))

const seriesMensais = computed<SerieGrafico[]>(() => [
  {
    nome: 'Aberta',
    cor: '#0364f7',
    valores: props.serieMensal.map((ponto) => ponto.releases.aberta)
  },
  {
    nome: 'Em Revisão',
    cor: '#f59e0b',
    valores: props.serieMensal.map((ponto) => ponto.releases.emRevisao)
  },
  {
    nome: 'Aprovado',
    cor: '#1a9e07',
    valores: props.serieMensal.map((ponto) => ponto.releases.aprovado)
  },
  {
    nome: 'Publicado',
    cor: '#112051',
    valores: props.serieMensal.map((ponto) => ponto.releases.publicado)
  }
])

const seriesAnuais = computed<SerieGrafico[]>(() => [
  {
    nome: 'Publicadas',
    cor: '#112051',
    valores: props.serieAnual.map((ponto) => ponto.publicadas)
  }
])

const titulo = computed(() =>
  modo.value === 'mensal' ? 'Publicações por mês' : 'Publicações por ano'
)
const descricao = computed(() =>
  modo.value === 'mensal'
    ? 'Release Week por status — eixo pela data de publicação.'
    : 'Releases publicadas nos últimos cinco anos.'
)
</script>

<template>
  <UiChartBars
    :titulo="titulo"
    :descricao="descricao"
    rotulo="Publicações do ciclo editorial"
    :categorias="modo === 'mensal' ? categoriasMensais : categoriasAnuais"
    :series="modo === 'mensal' ? seriesMensais : seriesAnuais"
    vazio="Nenhuma publicação no período."
  >
    <template #actions>
      <UiSegmented
        :model-value="modo"
        :options="opcoesModo"
        aria-label="Alternar visualização mensal ou anual"
        @update:model-value="modo = $event as 'mensal' | 'anual'"
      />
    </template>
  </UiChartBars>
</template>
