<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Search, CheckCircle2, Rocket } from '@lucide/vue'
import { useEscopoProjetosModelo } from './useEscopoProjetosModelo'

// Quatro KPIs do conjunto VIGENTE (filtrado, quando houver filtro): Em
// Andamento, Homologação, Concluído e Publicado.
const { kpis } = useEscopoProjetosModelo()

const emAndamento = computed(() => String(kpis.value.emAndamento))
const homologacao = computed(() => String(kpis.value.homologacao))
const concluidos = computed(() => String(kpis.value.concluidos))
const publicados = computed(() => String(kpis.value.publicados))
</script>

<template>
  <section aria-label="Indicadores de Escopo de Projetos">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiKpi titulo="Em Andamento" :valor="emAndamento" cor="#0364f7" :icone="Clock" />
      <UiKpi titulo="Homologação" :valor="homologacao" cor="#7c3aed" :icone="Search" />
      <UiKpi titulo="Concluído" :valor="concluidos" cor="#1a9e07" :icone="CheckCircle2" />
      <UiKpi titulo="Publicado" :valor="publicados" cor="#112051" :icone="Rocket" />
    </div>
  </section>
</template>
