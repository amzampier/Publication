<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleSlash, Ban } from '@lucide/vue'
import { useParceirosModelo } from './useParceirosModelo'

// KPIs derivam do conjunto VIGENTE (filtrado, quando houver filtro): Ativos,
// Inativos e Bloqueados.
const { ativos, inativos, bloqueados } = useParceirosModelo()

const ativosStr = computed(() => String(ativos.value))
const inativosStr = computed(() => String(inativos.value))
const bloqueadosStr = computed(() => String(bloqueados.value))
</script>

<template>
  <section aria-label="Indicadores de parceiros">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UiKpi titulo="Ativos" :valor="ativosStr" cor="#047857" :icone="CircleCheck" />
      <UiKpi titulo="Inativos" :valor="inativosStr" cor="#64748b" :icone="CircleSlash" />
      <UiKpi titulo="Bloqueados" :valor="bloqueadosStr" cor="#be123c" :icone="Ban" />
    </div>
  </section>
</template>
