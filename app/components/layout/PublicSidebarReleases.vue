<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronDown, ChevronRight } from '@lucide/vue'
import type { PublicoAnoReleases } from '#shared/publico'
import { rotuloChamadas } from '#shared/publico'

const props = defineProps<{
  anos: PublicoAnoReleases[]
  selecionada: string | null
}>()

defineEmits<{ (e: 'selecionar', id: string): void }>()

const anosAbertos = ref<Record<number, boolean>>({})
const mesesAbertos = ref<Record<string, boolean>>({})

watch(
  () => props.anos,
  (anos) => {
    const primeiroAno = anos[0]
    if (!primeiroAno) return
    if (anosAbertos.value[primeiroAno.ano] === undefined) {
      anosAbertos.value[primeiroAno.ano] = true
    }
    const primeiroMes = primeiroAno.meses[0]
    if (primeiroMes) {
      const chave = `${primeiroAno.ano}-${primeiroMes.mes}`
      if (mesesAbertos.value[chave] === undefined) mesesAbertos.value[chave] = true
    }
  },
  { immediate: true }
)

const abertoAno = (ano: number, indice: number): boolean =>
  anosAbertos.value[ano] ?? indice === 0

const abertoMes = (ano: number, mes: string, indice: number): boolean =>
  mesesAbertos.value[`${ano}-${mes}`] ?? indice === 0

const alternarAno = (ano: number, indice: number) => {
  anosAbertos.value[ano] = !abertoAno(ano, indice)
}

const alternarMes = (ano: number, mes: string, indice: number) => {
  const chave = `${ano}-${mes}`
  mesesAbertos.value[chave] = !abertoMes(ano, mes, indice)
}
</script>

<template>
  <p v-if="!anos.length" class="px-2 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
    Nenhuma release publicada.
  </p>

  <div
    v-for="(ano, indiceAno) in anos"
    :key="ano.ano"
    class="my-1 border-l-2 border-slate-200 pl-2 dark:border-slate-700"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-slate-300 dark:hover:text-indigo-400"
      :aria-expanded="abertoAno(ano.ano, indiceAno)"
      :aria-controls="`publico-releases-ano-${ano.ano}`"
      @click="alternarAno(ano.ano, indiceAno)"
    >
      <span class="font-mono">{{ ano.ano }}</span>
      <ChevronDown v-if="abertoAno(ano.ano, indiceAno)" class="h-3 w-3 text-slate-400" aria-hidden="true" />
      <ChevronRight v-else class="h-3 w-3 text-slate-400" aria-hidden="true" />
    </button>

    <div
      v-if="abertoAno(ano.ano, indiceAno)"
      :id="`publico-releases-ano-${ano.ano}`"
      class="space-y-1.5 pt-1 pl-2"
    >
      <div
        v-for="(mes, indiceMes) in ano.meses"
        :key="`${ano.ano}-${mes.mes}`"
        class="space-y-1"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-slate-400 dark:hover:text-slate-100"
          :aria-expanded="abertoMes(ano.ano, mes.mes, indiceMes)"
          :aria-controls="`publico-releases-mes-${ano.ano}-${indiceMes}`"
          @click="alternarMes(ano.ano, mes.mes, indiceMes)"
        >
          <span class="truncate">{{ mes.mes }}</span>
          <span class="flex items-center gap-1">
            <span class="text-[10px] text-slate-500 dark:text-slate-400">{{ mes.releases.length }}</span>
            <ChevronDown
              v-if="abertoMes(ano.ano, mes.mes, indiceMes)"
              class="h-2.5 w-2.5 text-slate-400"
              aria-hidden="true"
            />
            <ChevronRight v-else class="h-2.5 w-2.5 text-slate-400" aria-hidden="true" />
          </span>
        </button>

        <div
          v-if="abertoMes(ano.ano, mes.mes, indiceMes)"
          :id="`publico-releases-mes-${ano.ano}-${indiceMes}`"
          class="space-y-0.5 pl-2"
        >
          <button
            v-for="rel in mes.releases"
            :key="rel.id"
            type="button"
            class="flex w-full flex-col rounded-lg px-2 py-1.5 text-left text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
            :class="
              selecionada === rel.id
                ? 'border-l-2 border-indigo-600 bg-indigo-50 font-semibold text-indigo-900 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100'
            "
            :aria-current="selecionada === rel.id ? 'true' : undefined"
            :aria-label="`Semana ${rel.semana}, versão ${rel.versao}, ${rotuloChamadas(rel.chamadas)}`"
            @click="$emit('selecionar', rel.id)"
          >
            <span class="flex items-center justify-between gap-1">
              <span class="flex min-w-0 items-center gap-1">
                <span class="truncate">Semana {{ rel.semana }}</span>
                <span
                  v-if="rel.versao"
                  class="shrink-0 rounded bg-indigo-100 px-1 font-mono text-[9px] font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200"
                >
                  v{{ rel.versao }}
                </span>
              </span>
              <span
                v-if="rel.destaqueSemana"
                class="shrink-0 text-[9px] font-semibold text-amber-700 uppercase dark:text-amber-400"
              >
                Nova
              </span>
            </span>
            <span class="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
              {{ rotuloChamadas(rel.chamadas) }}<template v-if="rel.release"> · Rel: {{ rel.release }}</template>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
