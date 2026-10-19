<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Search, CheckCircle2, Rocket } from '@lucide/vue'
import { useReleaseWeekModelo } from './useReleaseWeekModelo'

// Quatro KPIs do conjunto VIGENTE (spec release-week): Abertas, Em Revisão,
// Aprovadas e Publicadas — recalculam quando um filtro refina a listagem.
const { kpis } = useReleaseWeekModelo()

const abertas = computed(() => String(kpis.value.abertas))
const emRevisao = computed(() => String(kpis.value.emRevisao))
const aprovadas = computed(() => String(kpis.value.aprovadas))
const publicadas = computed(() => String(kpis.value.publicadas))
</script>

<template>
  <section aria-label="Indicadores de Release Week">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiKpi titulo="Abertas" :valor="abertas" cor="#0364f7" :icone="Clock" />
      <UiKpi titulo="Em Revisão" :valor="emRevisao" cor="#7c3aed" :icone="Search" />
      <UiKpi titulo="Aprovadas" :valor="aprovadas" cor="#1a9e07" :icone="CheckCircle2" />
      <UiKpi titulo="Publicadas" :valor="publicadas" cor="#112051" :icone="Rocket" />
    </div>
  </section>
</template>
