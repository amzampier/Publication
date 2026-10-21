<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Megaphone, ShieldCheck, XCircle } from '@lucide/vue'
import { useLancarChamadasModelo } from './useLancarChamadasModelo'

const { kpis } = useLancarChamadasModelo()

const total = computed(() => String(kpis.value.total))
const revisar = computed(() => String(kpis.value.revisar))
const aprovado = computed(() => String(kpis.value.aprovado))
const recusado = computed(() => String(kpis.value.recusado))
</script>

<template>
  <section aria-label="Indicadores de Lançar as Chamadas">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiKpi titulo="Total" :valor="total" cor="#0364f7" :icone="Megaphone" />
      <UiKpi titulo="Revisar" :valor="revisar" cor="#f59e0b" :icone="Clock" />
      <UiKpi titulo="Aprovado" :valor="aprovado" cor="#1a9e07" :icone="ShieldCheck" />
      <UiKpi titulo="Recusado" :valor="recusado" cor="#be123c" :icone="XCircle" />
    </div>
  </section>
</template>
