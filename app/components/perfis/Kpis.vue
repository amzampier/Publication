<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck, UserCheck, UserX, KeyRound } from '@lucide/vue'
import { usePerfisDemo } from './usePerfisDemo'

// KPIs derivam do conjunto VIGENTE (spec perfis-acesso: recalculam quando o
// conjunto de perfis muda; na fase 1 o conjunto é a base de demonstração)
const { perfis, totalPermissoesConcedidas, totalPermissoesPossiveis } = usePerfisDemo()

const total = computed(() => perfis.value.length)
const ativos = computed(() => perfis.value.filter((p) => p.status === 'Ativo').length)
const inativos = computed(() => perfis.value.filter((p) => p.status === 'Inativo').length)
const permissoes = computed(
  () => `${totalPermissoesConcedidas.value}/${totalPermissoesPossiveis.value}`
)
</script>

<template>
  <section aria-label="Indicadores de perfis de acesso">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UiKpi titulo="Total de perfis" :valor="String(total)" cor="#f5b302" :icone="ShieldCheck" />
      <UiKpi titulo="Ativos" :valor="String(ativos)" cor="#047857" :icone="UserCheck" />
      <UiKpi titulo="Inativos" :valor="String(inativos)" cor="#64748b" :icone="UserX" />
      <UiKpi
        titulo="Permissões concedidas"
        :valor="permissoes"
        cor="#112051"
        :icone="KeyRound"
      />
    </div>
  </section>
</template>
