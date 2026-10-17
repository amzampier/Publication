<script setup lang="ts">
import { computed } from 'vue'
import { Boxes, CircleCheck, CircleSlash, AppWindow, Globe, Layers } from '@lucide/vue'
import { useSoftwaresModelo } from './useSoftwaresModelo'

// KPIs derivam do conjunto VIGENTE (spec softwares: recalculam quando o
// conjunto muda — inclusive quando um filtro do módulo o refina).
const { total, ativos, inativos, porCategoria } = useSoftwaresModelo()

const totalStr = computed(() => String(total.value))
const ativosStr = computed(() => String(ativos.value))
const inativosStr = computed(() => String(inativos.value))
const delphiStr = computed(() => String(porCategoria.value.Delphi))
const webStr = computed(() => String(porCategoria.value.Web))
const delphiWebStr = computed(() => String(porCategoria.value['Delphi e Web']))
</script>

<template>
  <section aria-label="Indicadores de softwares">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <UiKpi titulo="Total de softwares" :valor="totalStr" cor="#0364f7" :icone="Boxes" />
      <UiKpi titulo="Ativos" :valor="ativosStr" cor="#047857" :icone="CircleCheck" />
      <UiKpi titulo="Inativos" :valor="inativosStr" cor="#64748b" :icone="CircleSlash" />
      <UiKpi titulo="Delphi" :valor="delphiStr" cor="#b070ef" :icone="AppWindow" />
      <UiKpi titulo="Web" :valor="webStr" cor="#50a1ff" :icone="Globe" />
      <UiKpi titulo="Delphi e Web" :valor="delphiWebStr" cor="#2dd4bf" :icone="Layers" />
    </div>
  </section>
</template>
