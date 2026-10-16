<script setup lang="ts">
import { computed } from 'vue'
import { ScrollText, CalendarDays, Users, Clock } from '@lucide/vue'
import { useAuditoriaModelo } from './useAuditoriaModelo'

// KPIs calculados no SERVIDOR sobre o conjunto filtrado (change
// paginacao-server-side-e-performance); o rótulo do período vem do filtro.
const { kpis, periodoRotulo } = useAuditoriaModelo()

const total = computed(() => kpis.value.registros)
const usuariosDistintos = computed(() => kpis.value.usuariosDistintos)

const ultimaAtividade = computed(() => {
  const iso = kpis.value.ultimaAtividade
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${mi}`
})
</script>

<template>
  <section aria-label="Indicadores da auditoria">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiKpi titulo="Registros" :valor="String(total)" :icone="ScrollText" />
      <UiKpi titulo="Período" :valor="periodoRotulo" :icone="CalendarDays" />
      <UiKpi titulo="Usuários distintos" :valor="String(usuariosDistintos)" :icone="Users" />
      <UiKpi titulo="Última atividade" :valor="ultimaAtividade" :icone="Clock" />
    </div>
  </section>
</template>