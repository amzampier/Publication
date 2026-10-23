<script setup lang="ts">
import type { RankingPainel } from '#shared/painel-executivo'

interface Props {
  porSoftware: RankingPainel[]
  porTipo: RankingPainel[]
  porImpacto: RankingPainel[]
}

defineProps<Props>()
</script>

<template>
  <section class="grid grid-cols-1 gap-5 lg:grid-cols-3" aria-label="Dimensões editoriais">
    <UiChartHorizontalBars
      titulo="Softwares mais atendidos"
      descricao="Chamadas do ano por software (vínculo N:N)."
      rotulo="Ranking de softwares por chamadas"
      :itens="porSoftware.map((item) => ({ rotulo: item.rotulo, valor: item.total }))"
      cor="#0364f7"
      vazio="Nenhum software vinculado no período."
    />

    <UiChartHorizontalBars
      titulo="Chamadas por tipo"
      descricao="Classificação técnica das chamadas lançadas no ano."
      rotulo="Distribuição de chamadas por tipo"
      :itens="porTipo.map((item) => ({ rotulo: item.rotulo, valor: item.total }))"
      cor="#8b5cf6"
      vazio="Nenhuma chamada lançada no período."
    />

    <UiChartHorizontalBars
      titulo="Chamadas por impacto"
      descricao="Nível de impacto informado nas chamadas do ano."
      rotulo="Distribuição de chamadas por impacto"
      :itens="porImpacto.map((item) => ({ rotulo: item.rotulo, valor: item.total }))"
      cor="#f59e0b"
      vazio="Nenhuma chamada lançada no período."
    />
  </section>
</template>
