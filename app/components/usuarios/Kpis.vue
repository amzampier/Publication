<script setup lang="ts">
import { computed } from 'vue'
import { Users, UserCheck, UserX, ShieldCheck } from '@lucide/vue'
import { useUsuarios } from './useUsuarios'

// KPIs calculados no SERVIDOR sobre o conjunto filtrado (change
// paginacao-server-side-e-performance) — refletem o banco, não só a página.
const { kpis } = useUsuarios()

const total = computed(() => kpis.value.total)
const ativos = computed(() => kpis.value.ativos)
const inativos = computed(() => kpis.value.inativos)
const perfisDistintos = computed(() => kpis.value.perfisDistintos)
</script>

<template>
  <section aria-label="Indicadores de usuários">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiKpi titulo="Total de usuários" :valor="String(total)" cor="#112051" :icone="Users" />
      <UiKpi titulo="Ativos" :valor="String(ativos)" cor="#047857" :icone="UserCheck" />
      <UiKpi titulo="Inativos" :valor="String(inativos)" cor="#64748b" :icone="UserX" />
      <UiKpi titulo="Perfis distintos" :valor="String(perfisDistintos)" cor="#f5b302" :icone="ShieldCheck" />
    </div>
  </section>
</template>
