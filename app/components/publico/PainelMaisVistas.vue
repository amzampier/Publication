<script setup lang="ts">
import { computed } from 'vue'
import { Clock, TrendingUp } from '@lucide/vue'
import type {
  PublicoModoRanking,
  PublicoReleaseResumoPainel
} from '#shared/publico'

const props = withDefaults(
  defineProps<{
    releases: PublicoReleaseResumoPainel[]
    modo: PublicoModoRanking
    demo?: boolean
  }>(),
  { demo: false }
)

const titulo = computed(() =>
  props.modo === 'vistas' ? 'Releases Mais Vistas' : 'Releases Recentes'
)
const subtitulo = computed(() =>
  props.modo === 'vistas' ? 'Top acessos' : 'Últimas publicações'
)
const Icone = computed(() => (props.modo === 'vistas' ? TrendingUp : Clock))
</script>

<template>
  <section aria-labelledby="painel-mais-vistas-titulo" class="min-w-0">
    <div class="mb-3 flex items-center gap-2">
      <component
        :is="Icone"
        class="h-5 w-5 text-indigo-600 dark:text-indigo-400"
        aria-hidden="true"
      />
      <div>
        <h2 id="painel-mais-vistas-titulo" class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {{ titulo }}
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ subtitulo }}</p>
      </div>
    </div>

    <div v-if="releases.length" class="space-y-3">
      <PublicoPainelReleaseCard
        v-for="(release, indice) in releases"
        :key="release.id"
        :release="release"
        :posicao="indice + 1"
        :mostrar-views="modo === 'vistas'"
        :demo="demo"
        compacto
      />
    </div>

    <div
      v-else
      class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
    >
      Ainda não há releases publicadas.
    </div>
  </section>
</template>
