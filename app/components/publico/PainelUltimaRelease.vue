<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Camera, CheckCircle2, Eye } from '@lucide/vue'
import { formatarData } from '#shared/manuais'
import {
  rotuloFotos,
  rotuloVisualizacoes,
  varianteTipoItem,
  type PublicoReleaseDestaque
} from '#shared/publico'

const props = withDefaults(
  defineProps<{
    release: PublicoReleaseDestaque | null
    rotulo: string
    demo?: boolean
  }>(),
  { demo: false }
)

const dataPublicacao = computed(() =>
  props.release?.publicadoEm ? formatarData(props.release.publicadoEm) : ''
)

const abrirRelease = async () => {
  if (!props.release || props.demo) return
  await navigateTo(`/releases/${props.release.id}`)
}
</script>

<template>
  <section aria-labelledby="painel-hero-titulo" class="min-w-0">
    <div
      v-if="release"
      class="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-brand-primary via-slate-950 to-indigo-950 p-5 text-slate-100 shadow-sm sm:p-7"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span
          class="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 py-1 font-semibold text-indigo-100"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-brand-accent" aria-hidden="true"></span>
          {{ rotulo }}
        </span>
        <span class="text-slate-300">·</span>
        <span class="font-mono tabular-nums text-slate-200">Semana {{ release.semana }} de {{ release.ano }}</span>
        <span v-if="release.versao" class="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-[11px] tabular-nums text-indigo-200">
          v{{ release.versao }}
        </span>
        <span v-if="release.release" class="rounded-md border border-indigo-400/30 bg-indigo-500/15 px-2 py-1 font-mono text-[11px] tabular-nums text-indigo-200">
          Rel: {{ release.release }}
        </span>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
        <span v-if="dataPublicacao">Publicada em {{ dataPublicacao }}</span>
        <span v-if="dataPublicacao && release.totalVisualizacoes > 0" aria-hidden="true">·</span>
        <span
          v-if="release.totalVisualizacoes > 0"
          class="inline-flex items-center gap-1 font-mono tabular-nums"
        >
          <Eye class="h-3.5 w-3.5" aria-hidden="true" />
          {{ rotuloVisualizacoes(release.totalVisualizacoes) }}
        </span>
      </div>

      <h2 id="painel-hero-titulo" class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {{ release.nome }}
      </h2>
      <p v-if="release.descricao" class="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">
        {{ release.descricao }}
      </p>

      <div v-if="release.chamadas.length" class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="chamada in release.chamadas"
          :key="chamada.id"
          class="flex min-w-0 flex-col rounded-xl border border-white/10 bg-white/[0.04] p-3"
        >
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-slate-300">
              CH: {{ chamada.chamada }}
            </span>
            <UiBadge :variant="varianteTipoItem(chamada.tipo)" size="sm">
              {{ chamada.tipo }}
            </UiBadge>
          </div>
          <h3 class="mt-2 text-sm font-semibold leading-snug text-slate-100">
            {{ chamada.titulo }}
          </h3>
          <p class="mt-1 text-[11px] text-slate-400">
            {{ chamada.software }}<span v-if="chamada.modulo"> · {{ chamada.modulo }}</span>
          </p>
          <div class="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px] text-slate-400">
            <span class="truncate">Parceiro: {{ chamada.parceiro || '—' }}</span>
            <span v-if="chamada.fotos > 0" class="inline-flex shrink-0 items-center gap-1 font-mono tabular-nums">
              <Camera class="h-3.5 w-3.5" aria-hidden="true" />
              {{ rotuloFotos(chamada.fotos) }}
            </span>
          </div>
        </article>
      </div>
      <p v-else class="mt-6 text-sm text-slate-400">Nenhuma chamada publicada nesta release.</p>

      <div class="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <UiButton
          variant="primary"
          size="lg"
          class="w-full sm:w-auto"
          :aria-label="`Ver release completa da Semana ${release.semana} de ${release.ano}`"
          @click="abrirRelease"
        >
          Ver release completa
          <template #rightIcon>
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </template>
        </UiButton>
        <p
          v-if="release.revisorNome"
          class="inline-flex items-center gap-1.5 text-xs text-slate-300"
        >
          <CheckCircle2 class="h-4 w-4 text-emerald-400" aria-hidden="true" />
          Aprovado pelo revisor técnico ({{ release.revisorNome }})
        </p>
      </div>
    </div>

    <div
      v-else
      class="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
    >
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Nenhuma release publicada ainda.
      </p>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Assim que uma Release Week for publicada, ela aparece em destaque aqui.
      </p>
    </div>
  </section>
</template>
