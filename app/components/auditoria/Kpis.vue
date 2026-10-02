<script setup lang="ts">
import { computed } from 'vue'
import { ScrollText, CalendarDays, Users, Clock } from '@lucide/vue'
import { useAuditoriaDemo, formatarDataHora } from './useAuditoriaDemo'

// KPIs derivam do conjunto FILTRADO (spec auditoria: contagem/usuarios/ultima
// atividade seguem os filtros; o rotulo do periodo vem do filtro vigente)
const { registrosFiltrados, periodoRotulo } = useAuditoriaDemo()

const total = computed(() => registrosFiltrados.value.length)

const usuariosDistintos = computed(
  () => new Set(registrosFiltrados.value.map((r) => r.usuario.nome)).size
)

const ultimaAtividade = computed(() => {
  const maisRecente = registrosFiltrados.value[0]
  if (!maisRecente) return '—'
  // Formato compacto (dd/mm HH:mm) — o ano completo truncava no valor text-2xl do UiKpi
  const d = new Date(maisRecente.registradoEm)
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