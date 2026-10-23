<script setup lang="ts">
import { computed } from 'vue'
import type { PontoSerieMensal } from '#shared/painel-executivo'

interface SerieGrafico {
  nome: string
  cor: string
  valores: number[]
}

interface Props {
  serieMensal: PontoSerieMensal[]
}

const props = defineProps<Props>()

const categorias = computed(() => props.serieMensal.map((ponto) => ponto.rotulo))

const series = computed<SerieGrafico[]>(() => [
  {
    nome: 'Lançadas',
    cor: '#0364f7',
    valores: props.serieMensal.map((ponto) => ponto.chamadasLancadas)
  },
  {
    nome: 'Liberadas',
    cor: '#1a9e07',
    valores: props.serieMensal.map((ponto) => ponto.chamadasLiberadas)
  }
])
</script>

<template>
  <UiChartLine
    titulo="Chamadas ao longo do ano"
    descricao="Lançadas por data de lançamento; liberadas por data de liberação até hoje. A data de liberação é herdada do conteúdo pai e pode ser prevista."
    rotulo="Chamadas lançadas e liberadas"
    :categorias="categorias"
    :series="series"
    vazio="Nenhuma chamada lançada no período."
  />
</template>
