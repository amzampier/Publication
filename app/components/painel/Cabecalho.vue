<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDashboard, RefreshCw } from '@lucide/vue'

interface Props {
  ano: number
  anos: number[]
  carregando: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:ano', ano: number): void
  (e: 'atualizar'): void
}>()

const opcoesAnos = computed(() =>
  props.anos.map((ano) => ({ value: String(ano), label: String(ano) }))
)

const selecionar = (valor: string | number) => {
  const ano = Number(valor)
  if (Number.isFinite(ano) && ano !== props.ano) emit('update:ano', ano)
}
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-brand-accent">
        <LayoutDashboard class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">Painel Executivo</h1>
        <p class="mt-1 text-xs text-slate-500">
          Visão consolidada do ciclo editorial — publicações, chamadas e homologação.
        </p>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-end sm:gap-2">
      <div v-if="opcoesAnos.length" class="w-full sm:w-32">
        <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Ano</span>
        <UiSelect
          :model-value="String(props.ano)"
          :options="opcoesAnos"
          :clearable="false"
          :disabled="props.carregando"
          aria-label="Selecionar ano do painel"
          placeholder="Ano"
          @update:model-value="selecionar"
        />
      </div>
      <p v-else class="text-[11px] text-slate-500">Sem lan?amentos</p>

      <UiButton
        variant="outline"
        size="md"
        class="w-full sm:w-auto"
        :loading="props.carregando"
        @click="emit('atualizar')"
      >
        <template #leftIcon><RefreshCw class="h-4 w-4" /></template>
        Atualizar
      </UiButton>
    </div>
  </header>
</template>
