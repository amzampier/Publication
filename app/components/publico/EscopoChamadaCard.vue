<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, ExternalLink, FileText, Gauge, Video } from '@lucide/vue'
import { formatarData } from '#shared/manuais'
import {
  rotuloImpacto,
  varianteImpacto,
  varianteTipoItem,
  type PublicoChamadaEscopo
} from '#shared/publico'

const props = withDefaults(
  defineProps<{
    chamada: PublicoChamadaEscopo
    publicacao?: string
    demo?: boolean
  }>(),
  { publicacao: '', demo: false }
)

const critico = computed(() => props.chamada.impacto === 'Crítico')
const alto = computed(() => props.chamada.impacto === 'Alto')

const temRodape = computed(() =>
  Boolean(
    props.chamada.manualTitulo ||
      props.chamada.linkManual ||
      props.chamada.linkVideo ||
      props.chamada.dataLiberacao
  )
)

const dataLiberacao = computed(() =>
  props.chamada.dataLiberacao ? formatarData(props.chamada.dataLiberacao) : ''
)

const linkClasse =
  'inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'

const linkPrimarioClasse =
  'inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-primary to-brand-structure px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:brightness-110 active:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus'
</script>

<template>
  <article
    :id="`chamada-${chamada.id}`"
    :data-impacto="critico ? 'critico' : alto ? 'alto' : undefined"
    :class="[
      'relative flex min-w-0 scroll-mt-24 flex-col rounded-2xl border bg-white p-4 shadow-xs transition-colors dark:bg-slate-900 sm:p-5',
      critico
        ? 'border-rose-300 dark:border-rose-800'
        : alto
          ? 'border-orange-300 dark:border-orange-800'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
    ]"
  >
    <svg
      v-if="critico || alto"
      :class="[
        'escopo-comet pointer-events-none absolute inset-0 h-full w-full',
        critico ? 'text-rose-600' : 'text-orange-500'
      ]"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        pathLength="100"
        stroke-dasharray="22 78"
        stroke-linecap="round"
      />
    </svg>

    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <span
          class="rounded-md bg-indigo-50 px-2.5 py-1 font-mono text-sm font-bold tabular-nums text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
        >
          #{{ chamada.chamada }}
        </span>
        <span
          v-if="chamada.parceiro"
          class="text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          {{ chamada.parceiro }}
        </span>
        <UiBadge :variant="varianteTipoItem(chamada.tipo)" size="sm" />
        <UiBadge
          v-if="chamada.impacto"
          :variant="varianteImpacto(chamada.impacto)"
          size="sm"
          :show-icon="chamada.impacto !== 'Crítico' && chamada.impacto !== 'Alto'"
        >
          <Gauge
            v-if="chamada.impacto !== 'Crítico' && chamada.impacto !== 'Alto'"
            class="h-3 w-3"
            aria-hidden="true"
          />
          {{ rotuloImpacto(chamada.impacto) }}
        </UiBadge>
        <span
          v-for="software in chamada.softwares"
          :key="software"
          class="rounded-md border border-indigo-200 bg-indigo-50/70 px-1.5 py-0.5 text-[10px] font-medium text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
        >
          {{ software }}
        </span>
      </div>

      <div
        v-if="publicacao"
        class="flex w-full shrink-0 flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400 sm:w-auto sm:items-end"
      >
        <span>
          Publicado em:
          <strong class="font-medium text-slate-700 dark:text-slate-200">
            {{ publicacao }}
          </strong>
        </span>
      </div>
    </div>

    <div
      class="mt-4 flex items-center rounded-lg border-l-[2.5px] border-l-brand-accent bg-gradient-to-r from-brand-primary to-brand-structure px-4 py-3"
    >
      <h3 class="min-w-0 text-base font-bold leading-snug text-white">
        {{ chamada.titulo }}
      </h3>
    </div>
    <div
      v-if="chamada.descricao"
      class="mt-3 rounded-lg border border-brand-focus/40 bg-slate-50/50 p-3 dark:border-brand-focus/50 dark:bg-slate-800/40"
    >
      <p class="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        Descrição
      </p>
      <p class="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {{ chamada.descricao }}
      </p>
    </div>

    <div
      v-if="chamada.solucao"
      class="mt-3 rounded-lg border border-brand-structure/40 bg-slate-50/70 p-3 dark:border-brand-structure/50 dark:bg-slate-800/40"
    >
      <p class="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        Solução
      </p>
      <p class="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {{ chamada.solucao }}
      </p>
    </div>

    <div
      v-if="chamada.tags.length"
      class="mt-3 flex flex-wrap items-center justify-end gap-1.5"
    >
      <span class="text-[11px] text-slate-500 dark:text-slate-400">Tags:</span>
      <ul
        class="flex flex-wrap items-center justify-end gap-1.5"
        aria-label="Tags da chamada"
      >
        <li v-for="tag in chamada.tags" :key="tag">
          <span
            class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            #{{ tag }}
          </span>
        </li>
      </ul>
    </div>

    <PublicoEscopoEvidencias
      v-if="chamada.evidencias.length"
      :evidencias="chamada.evidencias"
      :titulo="chamada.titulo"
    />

    <div
      v-if="temRodape"
      class="mt-4 border-t border-brand-accent pt-3 dark:border-brand-accent/70"
    >
      <p
        v-if="chamada.manualTitulo"
        class="mb-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
      >
        <span
          class="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
        >
          Manual:
        </span>
        <span class="ml-1 font-medium text-slate-700 dark:text-slate-200">
          {{ chamada.manualTitulo }}
        </span>
      </p>

      <div
        v-if="chamada.linkManual || chamada.linkVideo || dataLiberacao"
        class="flex flex-wrap items-center gap-2"
      >
        <component
          :is="demo ? 'span' : 'a'"
          v-if="chamada.linkManual"
          v-bind="
            demo
              ? {}
              : {
                  href: chamada.linkManual,
                  target: '_blank',
                  rel: 'noopener noreferrer'
                }
          "
          :class="linkPrimarioClasse"
        >
          <FileText class="h-3.5 w-3.5" aria-hidden="true" />
          Documentação Externa
          <ExternalLink class="h-3 w-3" aria-hidden="true" />
        </component>

        <component
          :is="demo ? 'span' : 'a'"
          v-if="chamada.linkVideo"
          v-bind="
            demo
              ? {}
              : {
                  href: chamada.linkVideo,
                  target: '_blank',
                  rel: 'noopener noreferrer'
                }
          "
          :class="linkClasse"
        >
          <Video class="h-3.5 w-3.5" aria-hidden="true" />
          Ver vídeo
          <ExternalLink class="h-3 w-3" aria-hidden="true" />
        </component>

        <span
          v-if="dataLiberacao"
          class="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"
        >
          <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
          Liberada em {{ dataLiberacao }}
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* Borda "cometa" do impacto: o traço percorre o perímetro do card em 5s, sem
   pausa em hover/focus. A cor vem de currentColor (text-rose-600 / text-orange-500). */
.escopo-comet rect {
  animation: escopo-comet-trail 5s linear infinite;
}

@keyframes escopo-comet-trail {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -100;
  }
}

@media (prefers-reduced-motion: reduce) {
  .escopo-comet {
    display: none;
  }

  article[data-impacto='critico'] {
    border-width: 2px;
    border-color: #e11d48;
  }

  article[data-impacto='alto'] {
    border-width: 2px;
    border-color: #f97316;
  }
}
</style>
