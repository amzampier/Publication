<script setup lang="ts">
import { computed } from 'vue'
import { Clock, ListFilter, ShieldCheck, XCircle } from '@lucide/vue'
import { useEsteiraRevisaoModelo } from './useEsteiraRevisaoModelo'

const { kpis } = useEsteiraRevisaoModelo()

const total = computed(() => String(kpis.value.total))
const revisar = computed(() => String(kpis.value.revisar))
const aprovado = computed(() => String(kpis.value.aprovado))
const recusado = computed(() => String(kpis.value.recusado))
</script>

<template>
  <section aria-label="Indicadores da Esteira de Revisão">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiKpi titulo="No filtro" :valor="total" cor="#0364f7" :icone="ListFilter" />
      <UiKpi titulo="Em revisão" :valor="revisar" cor="#f59e0b" :icone="Clock" />
      <UiKpi titulo="Aprovadas" :valor="aprovado" cor="#1a9e07" :icone="ShieldCheck" />
      <UiKpi titulo="Recusadas" :valor="recusado" cor="#be123c" :icone="XCircle" />
    </div>
  </section>
</template>
