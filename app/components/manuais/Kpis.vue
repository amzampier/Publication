<script setup lang="ts">
import { computed } from 'vue'
import { FileText, Search, MessageSquareWarning, CheckCircle2, Rocket } from '@lucide/vue'
import { useManuaisModelo } from './useManuaisModelo'

// Cinco KPIs do conjunto VIGENTE (spec manuais-mensais): um por status do
// catálogo mensal — recalculam quando um filtro refina a listagem.
const { kpis } = useManuaisModelo()

const rascunho = computed(() => String(kpis.value.rascunho))
const emRevisao = computed(() => String(kpis.value.emRevisao))
const alteracoes = computed(() => String(kpis.value.alteracoes))
const aprovados = computed(() => String(kpis.value.aprovados))
const publicados = computed(() => String(kpis.value.publicados))
</script>

<template>
  <section aria-label="Indicadores de Manuais Mensais">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <UiKpi titulo="Rascunho" :valor="rascunho" cor="#64748b" :icone="FileText" />
      <UiKpi titulo="Em Revisão" :valor="emRevisao" cor="#7c3aed" :icone="Search" />
      <UiKpi
        titulo="Alterações Solicitadas"
        :valor="alteracoes"
        cor="#d97706"
        :icone="MessageSquareWarning"
      />
      <UiKpi titulo="Aprovado" :valor="aprovados" cor="#1a9e07" :icone="CheckCircle2" />
      <UiKpi titulo="Publicado" :valor="publicados" cor="#112051" :icone="Rocket" />
    </div>
  </section>
</template>
