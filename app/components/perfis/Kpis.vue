<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck, UserCheck, UserX, ShieldOff, KeyRound } from '@lucide/vue'
import { usePerfisDemo } from './usePerfisDemo'

// KPIs derivam do conjunto VIGENTE (spec perfis-acesso: recalculam quando o
// conjunto de perfis muda — inclusive quando um filtro do módulo o refina; na
// fase 1, sem filtro, o conjunto é a base de demonstração)
const { perfisFiltrados, totalPermissoesConcedidas, totalPermissoesPossiveis } = usePerfisDemo()

const total = computed(() => perfisFiltrados.value.length)
const ativos = computed(() => perfisFiltrados.value.filter((p) => p.situacao === 'Ativo').length)
const inativos = computed(() => perfisFiltrados.value.filter((p) => p.situacao === 'Inativo').length)
const bloqueados = computed(() => perfisFiltrados.value.filter((p) => p.situacao === 'Bloqueado').length)
const permissoes = computed(
  () => `${totalPermissoesConcedidas.value}/${totalPermissoesPossiveis.value}`
)
</script>

<template>
  <section aria-label="Indicadores de perfis de acesso">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <UiKpi titulo="Total de perfis" :valor="String(total)" cor="#f5b302" :icone="ShieldCheck" />
      <UiKpi titulo="Ativos" :valor="String(ativos)" cor="#047857" :icone="UserCheck" />
      <UiKpi titulo="Inativos" :valor="String(inativos)" cor="#64748b" :icone="UserX" />
      <UiKpi titulo="Bloqueados" :valor="String(bloqueados)" cor="#be123c" :icone="ShieldOff" />
      <UiKpi
        titulo="Permissões concedidas"
        :valor="permissoes"
        cor="#112051"
        :icone="KeyRound"
      />
    </div>
  </section>
</template>
