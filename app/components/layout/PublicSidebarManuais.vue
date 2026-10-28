<script setup lang="ts">
import { ref, watch } from 'vue'
import { BookOpen, ChevronDown, ChevronRight } from '@lucide/vue'
import type { PublicoAnoManuais } from '#shared/publico'
import { rotuloManuais } from '#shared/publico'

const props = defineProps<{
  anos: PublicoAnoManuais[]
  selecionado: { ano: number; mes: string } | null
}>()

defineEmits<{ (e: 'selecionar', payload: { ano: number; mes: string }): void }>()

const anosAbertos = ref<Record<number, boolean>>({})

watch(
  () => props.anos,
  (anos) => {
    const primeiroAno = anos[0]
    if (primeiroAno && anosAbertos.value[primeiroAno.ano] === undefined) {
      anosAbertos.value[primeiroAno.ano] = true
    }
  },
  { immediate: true }
)

const abertoAno = (ano: number, indice: number): boolean =>
  anosAbertos.value[ano] ?? indice === 0

const alternarAno = (ano: number, indice: number) => {
  anosAbertos.value[ano] = !abertoAno(ano, indice)
}

const mesSelecionado = (ano: number, mes: string): boolean =>
  props.selecionado?.ano === ano && props.selecionado?.mes === mes
</script>

<template>
  <p v-if="!anos.length" class="px-2 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
    Nenhum manual publicado.
  </p>

  <div
    v-for="(ano, indiceAno) in anos"
    :key="ano.ano"
    class="my-1 border-l-2 border-emerald-200 pl-2 dark:border-emerald-900"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between py-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-slate-300 dark:hover:text-emerald-400"
      :aria-expanded="abertoAno(ano.ano, indiceAno)"
      :aria-controls="`publico-manuais-ano-${ano.ano}`"
      :title="`Expandir meses de ${ano.ano}`"
      @click="alternarAno(ano.ano, indiceAno)"
    >
      <span class="flex items-center gap-1.5">
        <span class="font-mono">{{ ano.ano }}</span>
        <span class="text-[10px] font-normal text-slate-500 dark:text-slate-400">
          ({{ ano.meses.length }} {{ ano.meses.length === 1 ? 'mês' : 'meses' }})
        </span>
      </span>
      <ChevronDown v-if="abertoAno(ano.ano, indiceAno)" class="h-3 w-3 text-slate-400" aria-hidden="true" />
      <ChevronRight v-else class="h-3 w-3 text-slate-400" aria-hidden="true" />
    </button>

    <div
      v-if="abertoAno(ano.ano, indiceAno)"
      :id="`publico-manuais-ano-${ano.ano}`"
      class="space-y-1 pt-1 pl-2"
    >
      <button
        v-for="mes in ano.meses"
        :key="`${ano.ano}-${mes.mes}`"
        type="button"
        class="flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
        :class="
          mesSelecionado(ano.ano, mes.mes)
            ? 'border-emerald-400 bg-emerald-100 font-bold text-emerald-950 shadow-sm ring-1 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-200'
            : 'border-slate-200/80 bg-white text-slate-700 hover:bg-emerald-50/70 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:text-slate-100'
        "
        :aria-current="mesSelecionado(ano.ano, mes.mes) ? 'true' : undefined"
        :aria-label="`${mes.mes} de ${ano.ano}: ${rotuloManuais(mes.manuais.length)}`"
        :title="`Selecionar os manuais de ${mes.mes}/${ano.ano}`"
        @click="$emit('selecionar', { ano: ano.ano, mes: mes.mes })"
      >
        <span class="flex min-w-0 items-center gap-1.5">
          <BookOpen
            class="h-3.5 w-3.5 shrink-0"
            :class="mesSelecionado(ano.ano, mes.mes) ? 'text-emerald-700 dark:text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'"
            aria-hidden="true"
          />
          <span class="truncate font-medium">{{ mes.mes }}</span>
        </span>

        <span
          class="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold"
          :class="
            mesSelecionado(ano.ano, mes.mes)
              ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
          "
        >
          {{ mes.manuais.length }}
        </span>
      </button>
    </div>
  </div>
</template>
