<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Eye } from '@lucide/vue'
import { formatarData } from '#shared/manuais'
import {
  rotuloChamadas,
  rotuloTipo,
  rotuloVisualizacoes,
  type PublicoReleaseResumoPainel
} from '#shared/publico'

const props = withDefaults(
  defineProps<{
    release: PublicoReleaseResumoPainel
    posicao?: number | null
    mostrarContagens?: boolean
    mostrarViews?: boolean
    compacto?: boolean
    demo?: boolean
  }>(),
  {
    posicao: null,
    mostrarContagens: false,
    mostrarViews: true,
    compacto: false,
    demo: false
  }
)

const dataPublicacao = computed(() => formatarData(props.release.publicadoEm))
</script>

<template>
  <article
    class="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    :class="compacto ? '' : 'h-full'"
  >
    <div class="flex flex-wrap items-center gap-2">
      <span
        v-if="posicao"
        class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-mono text-xs font-bold tabular-nums text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
        :aria-label="`Posição ${posicao}`"
      >
        {{ posicao }}
      </span>
      <span class="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
        Semana {{ release.semana }} / {{ release.ano }}
      </span>
      <span v-if="release.versao" class="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        v{{ release.versao }}
      </span>
      <span v-if="release.release" class="rounded-md border border-indigo-200 bg-indigo-50/70 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
        Rel: {{ release.release }}
      </span>
      <span
        v-if="mostrarViews && release.totalVisualizacoes > 0"
        class="ml-auto inline-flex items-center gap-1 font-mono text-[10px] tabular-nums text-slate-500 dark:text-slate-400"
      >
        <Eye class="h-3.5 w-3.5" aria-hidden="true" />
        {{ rotuloVisualizacoes(release.totalVisualizacoes) }}
      </span>
    </div>

    <h3 class="mt-2 text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
      {{ release.nome }}
    </h3>
    <p v-if="release.descricao" class="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
      {{ release.descricao }}
    </p>

    <div v-if="mostrarContagens" class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
      <span v-if="release.contagens.correcao > 0" class="font-medium text-rose-700 dark:text-rose-300">
        {{ rotuloTipo('Correção', release.contagens.correcao) }}
      </span>
      <span v-if="release.contagens.correcao > 0 && (release.contagens.melhoria > 0 || release.contagens.nova > 0)" class="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
      <span v-if="release.contagens.melhoria > 0" class="font-medium text-emerald-700 dark:text-emerald-300">
        {{ rotuloTipo('Melhoria', release.contagens.melhoria) }}
      </span>
      <span v-if="release.contagens.melhoria > 0 && release.contagens.nova > 0" class="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
      <span v-if="release.contagens.nova > 0" class="font-medium text-indigo-700 dark:text-indigo-300">
        {{ rotuloTipo('Nova Funcionalidade', release.contagens.nova) }}
      </span>
      <span v-if="release.chamadas === 0" class="text-slate-500 dark:text-slate-400">Sem chamadas publicadas</span>
    </div>

    <div class="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <span class="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{{ rotuloChamadas(release.chamadas) }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ dataPublicacao }}</span>
      </span>
      <NuxtLink
        v-if="!demo"
        :to="`/releases/${release.id}`"
        class="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-indigo-300 dark:hover:text-indigo-200"
        :aria-label="`Ver chamadas da Semana ${release.semana} de ${release.ano}`"
      >
        Ver chamadas
        <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
      </NuxtLink>
      <span
        v-else
        class="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300"
      >
        Ver chamadas
        <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </div>
  </article>
</template>
