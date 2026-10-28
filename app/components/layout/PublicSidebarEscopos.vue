<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, ChevronRight, Monitor } from '@lucide/vue'
import type { PublicoEscopoResumo } from '#shared/publico'
import {
  contarSistemas,
  rotuloChamadas,
  rotuloSistemas
} from '#shared/publico'

const props = defineProps<{
  escopos: PublicoEscopoResumo[]
  selecionado: { escopoId: string; sistema: string | null } | null
}>()

defineEmits<{
  (e: 'selecionar', payload: { escopoId: string; sistema: string | null }): void
}>()

const projetosAbertos = ref<Record<string, boolean>>({})

const abertoProjeto = (id: string, indice: number): boolean =>
  projetosAbertos.value[id] ?? (indice === 0 || props.selecionado?.escopoId === id)

const alternarProjeto = (id: string, indice: number) => {
  projetosAbertos.value[id] = !abertoProjeto(id, indice)
}

const escopoAtivo = (id: string): boolean => props.selecionado?.escopoId === id

const sistemaAtivo = (escopoId: string, sistema: string): boolean =>
  props.selecionado?.escopoId === escopoId && props.selecionado?.sistema === sistema
</script>

<template>
  <p v-if="!escopos.length" class="px-2 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
    Nenhum escopo publicado.
  </p>

  <div
    v-for="(escopo, indice) in escopos"
    :key="escopo.id"
    class="overflow-hidden rounded-2xl border transition-all"
    :class="
      escopoAtivo(escopo.id)
        ? 'border-purple-300 bg-purple-50/20 shadow-sm dark:border-purple-500/60 dark:bg-purple-500/10'
        : 'border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
    "
  >
    <div class="p-2.5">
      <div class="mb-1 flex items-center justify-between gap-1">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
          :aria-expanded="abertoProjeto(escopo.id, indice)"
          :aria-controls="`publico-escopo-${escopo.id}`"
          @click="alternarProjeto(escopo.id, indice)"
        >
          <span class="text-purple-600 dark:text-purple-400">
            <ChevronDown v-if="abertoProjeto(escopo.id, indice)" class="h-3.5 w-3.5" aria-hidden="true" />
            <ChevronRight v-else class="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span class="shrink-0 rounded bg-purple-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-purple-800 dark:bg-purple-500/20 dark:text-purple-200">
            {{ escopo.versao }}
          </span>
          <span class="shrink-0 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Ano {{ escopo.ano }}
          </span>
        </button>

        <button
          type="button"
          class="shrink-0 rounded-lg border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 transition-all hover:bg-purple-100 hover:text-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200 dark:hover:bg-purple-500/25 dark:hover:text-white"
          title="Mostrar todas as chamadas deste projeto na página"
          @click="$emit('selecionar', { escopoId: escopo.id, sistema: null })"
        >
          Ver Tudo
        </button>
      </div>

      <button
        type="button"
        class="w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
        @click="alternarProjeto(escopo.id, indice)"
      >
        <p class="line-clamp-1 text-xs leading-snug font-semibold text-slate-800 hover:text-purple-900 dark:text-slate-100 dark:hover:text-purple-200">
          {{ escopo.nome }}
        </p>
      </button>

      <div class="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <span class="flex items-center gap-1">
          <Monitor class="h-3 w-3 text-purple-500 dark:text-purple-400" aria-hidden="true" />
          <strong class="text-slate-700 dark:text-slate-200">{{ rotuloSistemas(contarSistemas(escopo)) }}</strong>
        </span>
        <span>
          <strong class="text-slate-700 dark:text-slate-200">{{ rotuloChamadas(escopo.chamadas) }}</strong>
        </span>
      </div>
    </div>

    <div
      v-if="abertoProjeto(escopo.id, indice)"
      :id="`publico-escopo-${escopo.id}`"
      class="space-y-1 border-t border-slate-200/90 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-800/50"
    >
      <div class="px-1 pb-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        Sistemas Contemplados:
      </div>

      <p v-if="!escopo.sistemas.length" class="px-1 py-1 text-[10px] text-slate-500 dark:text-slate-400">
        Nenhum sistema contemplado.
      </p>

      <button
        v-for="sistema in escopo.sistemas"
        :key="`${escopo.id}-${sistema.nome}`"
        type="button"
        class="flex w-full items-center justify-between rounded-xl border p-2 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
        :class="
          sistemaAtivo(escopo.id, sistema.nome)
            ? 'border-purple-400 bg-purple-100 font-bold text-purple-950 shadow-sm ring-1 ring-purple-500/30 dark:border-purple-500 dark:bg-purple-500/15 dark:text-purple-200'
            : 'border-slate-200/80 bg-white text-slate-700 hover:bg-purple-50/70 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-purple-500/10 dark:hover:text-slate-100'
        "
        :aria-current="sistemaAtivo(escopo.id, sistema.nome) ? 'true' : undefined"
        :aria-label="`${sistema.nome}: ${rotuloChamadas(sistema.chamadas)}`"
        :title="`Selecionar o sistema ${sistema.nome}`"
        @click="$emit('selecionar', { escopoId: escopo.id, sistema: sistema.nome })"
      >
        <span class="flex min-w-0 items-center gap-1.5">
          <Monitor
            class="h-3.5 w-3.5 shrink-0"
            :class="sistemaAtivo(escopo.id, sistema.nome) ? 'text-purple-700 dark:text-purple-300' : 'text-purple-500 dark:text-purple-400'"
            aria-hidden="true"
          />
          <span class="truncate font-medium">{{ sistema.nome }}</span>
        </span>

        <span
          class="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold"
          :class="
            sistemaAtivo(escopo.id, sistema.nome)
              ? 'bg-purple-600 text-white dark:bg-purple-500 dark:text-purple-950'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          "
        >
          {{ sistema.chamadas }}
        </span>
      </button>
    </div>
  </div>
</template>
