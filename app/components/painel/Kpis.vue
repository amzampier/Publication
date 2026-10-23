<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle2,
  Megaphone,
  Rocket,
  Timer,
  Workflow,
  XCircle
} from '@lucide/vue'
import {
  formatarLeadTime,
  formatarPercentual,
  type KpisPainel
} from '#shared/painel-executivo'

interface Props {
  kpis: KpisPainel
}

const props = defineProps<Props>()

const releases = computed(() => String(props.kpis.releasesPublicadas))
const lancadas = computed(() => String(props.kpis.chamadasLancadas))
const liberadas = computed(() => String(props.kpis.chamadasLiberadas))
const fluxo = computed(() => formatarPercentual(props.kpis.percentualFluxo))
const recusa = computed(() => formatarPercentual(props.kpis.taxaRecusa))
const leadTime = computed(() =>
  props.kpis.chamadasLiberadas > 0
    ? formatarLeadTime(props.kpis.leadTimeMedioDias).replace('—', '0 d')
    : '—'
)
</script>

<template>
  <section aria-label="Indicadores do ciclo editorial">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <UiKpi titulo="Releases publicadas" :valor="releases" cor="#112051" :icone="Rocket" />
      <UiKpi titulo="Chamadas lançadas" :valor="lancadas" cor="#f59e0b" :icone="Megaphone" />
      <UiKpi titulo="Chamadas liberadas" :valor="liberadas" cor="#1a9e07" :icone="CheckCircle2" />
      <UiKpi titulo="Fluxo concluído" :valor="fluxo" cor="#8b5cf6" :icone="Workflow" />
      <UiKpi titulo="Lead time médio" :valor="leadTime" cor="#0364f7" :icone="Timer" />
      <UiKpi titulo="Taxa de recusa" :valor="recusa" cor="#be123c" :icone="XCircle" />
    </div>
  </section>
</template>
