<script setup lang="ts">
import { ArrowRight, BookOpen, ExternalLink, FileText, PlayCircle } from '@lucide/vue'
import {
  varianteTipoItem,
  type PublicoManualItemDestaque
} from '#shared/publico'

withDefaults(
  defineProps<{
    manuais: PublicoManualItemDestaque[]
    demo?: boolean
  }>(),
  { demo: false }
)

const contexto = (manual: PublicoManualItemDestaque): string => {
  const partes = [manual.modulo, `${manual.mes}/${manual.ano}`].filter(Boolean)
  return partes.join(' · ')
}
</script>

<template>
  <section aria-labelledby="painel-manuais-titulo" class="min-w-0">
    <div class="mb-3 flex items-center gap-2">
      <BookOpen class="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      <div>
        <h2 id="painel-manuais-titulo" class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Manuais em Destaque dessa Semana
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Guias práticos atualizados</p>
      </div>
    </div>

    <div v-if="manuais.length" class="space-y-3">
      <article
        v-for="manual in manuais"
        :key="`${manual.card}-${manual.id}`"
        class="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="manual.software"
            class="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {{ manual.software }}
          </span>
          <UiBadge v-if="manual.tipo" :variant="varianteTipoItem(manual.tipo)" size="sm">
            {{ manual.tipo }}
          </UiBadge>
          <span class="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
            {{ contexto(manual) }}
          </span>
        </div>

        <h3 class="mt-2 text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
          {{ manual.titulo }}
        </h3>
        <p v-if="manual.descricao" class="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {{ manual.descricao }}
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <a
            v-if="manual.linkVideo"
            :href="manual.linkVideo"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            <PlayCircle class="h-3.5 w-3.5" aria-hidden="true" />
            Ver vídeo
          </a>
          <a
            v-if="manual.linkManual"
            :href="manual.linkManual"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            <FileText class="h-3.5 w-3.5" aria-hidden="true" />
            Manual online
            <ExternalLink class="h-3 w-3" aria-hidden="true" />
          </a>
          <NuxtLink
            v-if="!demo && manual.card === 'item'"
            :to="`/manuais/${manual.manualId}/itens/${manual.id}`"
            class="ml-auto inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-indigo-300 dark:hover:text-indigo-200"
            :aria-label="`Ler conteúdo: ${manual.titulo}`"
          >
            Ler conteúdo
            <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink
            v-else-if="!demo"
            :to="`/manuais/${manual.manualId}`"
            class="ml-auto inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-emerald-300 dark:hover:text-emerald-200"
            :aria-label="`Ler conteúdo do manual: ${manual.titulo}`"
          >
            Ler conteúdo
            <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
          </NuxtLink>
          <span
            v-else
            class="ml-auto inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300"
          >
            Ler conteúdo
            <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </article>
    </div>

    <div
      v-else
      class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
    >
      Nenhum manual em destaque nesta semana.
    </div>
  </section>
</template>
