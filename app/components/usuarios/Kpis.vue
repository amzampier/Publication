<script setup lang="ts">
import { computed } from 'vue'
import { Users, UserCheck, UserX, ShieldCheck } from '@lucide/vue'
import { useUsuariosDemo } from './useUsuariosDemo'

// KPIs derivam do conjunto VIGENTE (spec gestao-usuarios: recalculam quando o
// conjunto de usuários muda; na fase 1 o filtro fica vazio = base completa)
const { usuariosFiltrados } = useUsuariosDemo()

const total = computed(() => usuariosFiltrados.value.length)
const ativos = computed(() => usuariosFiltrados.value.filter((u) => u.status === 'Ativo').length)
const inativos = computed(() => usuariosFiltrados.value.filter((u) => u.status === 'Inativo').length)
const perfisDistintos = computed(
  () => new Set(usuariosFiltrados.value.map((u) => u.perfil)).size
)
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
