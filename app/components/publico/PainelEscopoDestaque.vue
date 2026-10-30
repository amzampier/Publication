<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, ArrowRight, CalendarDays, FolderGit2, Monitor } from '@lucide/vue'
import { formatarData } from '#shared/escopo-projetos'
import {
  rotuloChamadas,
  rotuloImpacto,
  rotuloSistemas,
  varianteImpacto,
  type PublicoChamadaCritica,
  type PublicoEscopoResumo
} from '#shared/publico'

const props = withDefaults(
  defineProps<{
    escopo: PublicoEscopoResumo | null
    criticas: PublicoChamadaCritica[]
    demo?: boolean
  }>(),
  { demo: false }
)

const publicadoEm = computed(() =>
  props.escopo?.publicadoEm ? formatarData(props.escopo.publicadoEm) : ''
)

const nomeEscopo = computed(() => props.escopo?.nome || 'Escopo de Projeto')

const ctaClasse =
  'inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50'

const criticaClasse =
  'block rounded-lg px-1 py-2 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/20'
</script>

<template>
  <section v-if="escopo" aria-labelledby="painel-escopo-titulo" class="min-w-0">
    <div class="mb-3 flex items-center gap-2">
      <FolderGit2 class="h-5 w-5 text-indigo-700 dark:text-indigo-400" aria-hidden="true" />
      <div>
        <h2
          id="painel-escopo-titulo"
          class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Escopo de Projeto
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Último projeto liberado</p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <article
        class="min-w-0 rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs dark:border-indigo-900/60 dark:bg-slate-900 lg:col-span-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="escopo.codigo"
            class="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            {{ escopo.codigo }}
          </span>
          <span
            v-if="escopo.versao"
            class="rounded-md bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200"
          >
            v{{ escopo.versao }}
          </span>
          <span v-if="escopo.ano" class="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Ano {{ escopo.ano }}
          </span>
          <span
            v-if="publicadoEm"
            class="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"
          >
            <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
            Publicado em {{ publicadoEm }}
          </span>
        </div>

        <h3 class="mt-3 text-base font-bold leading-snug text-slate-900 dark:text-slate-100">
          {{ escopo.nome }}
        </h3>

        <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
          <span class="inline-flex items-center gap-1.5">
            <strong class="font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {{ rotuloChamadas(escopo.chamadas) }}
            </strong>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Monitor class="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" aria-hidden="true" />
            <strong class="font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {{ rotuloSistemas(escopo.sistemas.length) }}
            </strong>
          </span>
        </div>

        <ul
          v-if="escopo.sistemas.length"
          class="mt-3 flex flex-wrap gap-1.5"
          aria-label="Sistemas contemplados no escopo"
        >
          <li v-for="sistema in escopo.sistemas" :key="sistema.nome">
            <span
              class="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50/70 px-1.5 py-0.5 text-[10px] font-medium text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              {{ sistema.nome }}
              <span class="font-mono tabular-nums text-indigo-600 dark:text-indigo-300">
                {{ sistema.chamadas }}
              </span>
            </span>
          </li>
        </ul>

        <div class="mt-4 border-t border-indigo-100 pt-3 dark:border-indigo-900/50">
          <NuxtLink
            v-if="!demo"
            :to="`/escopos/${escopo.id}`"
            :class="ctaClasse"
            :aria-label="`Ver escopo completo de ${nomeEscopo}`"
          >
            Ver escopo completo
            <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
          </NuxtLink>
          <span v-else :class="ctaClasse" :aria-label="`Ver escopo completo de ${nomeEscopo}`">
            Ver escopo completo
            <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </article>

      <article
        v-if="criticas.length"
        class="min-w-0 rounded-2xl border border-rose-200 bg-white p-4 shadow-xs dark:border-rose-900/60 dark:bg-slate-900"
      >
        <div class="flex items-center gap-2">
          <AlertTriangle class="h-4 w-4 text-rose-700 dark:text-rose-300" aria-hidden="true" />
          <h3 class="text-sm font-bold text-rose-800 dark:text-rose-200">
            Chamadas em destaque
          </h3>
          <span
            class="ml-auto rounded bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {{ criticas.length }}
          </span>
        </div>

        <ul class="mt-2 divide-y divide-rose-100 dark:divide-rose-900/40">
          <li v-for="critica in criticas" :key="critica.id">
            <NuxtLink
              v-if="!demo"
              :to="`/escopos/${escopo.id}#chamada-${critica.id}`"
              :class="criticaClasse"
              :aria-label="`Abrir a chamada ${critica.chamada}: ${critica.titulo}`"
            >
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  #{{ critica.chamada }}
                </span>
                <UiBadge :variant="varianteImpacto(critica.impacto)" size="sm">
                  {{ rotuloImpacto(critica.impacto) }}
                </UiBadge>
              </div>
              <p class="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-slate-800 dark:text-slate-100">
                {{ critica.titulo }}
              </p>
              <p
                v-if="critica.softwares.length || critica.parceiro"
                class="mt-0.5 line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400"
              >
                {{ [critica.softwares.join(' · '), critica.parceiro].filter(Boolean).join(' · ') }}
              </p>
            </NuxtLink>
            <div
              v-else
              :class="criticaClasse"
              :aria-label="`Chamada ${critica.chamada}: ${critica.titulo}`"
            >
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  #{{ critica.chamada }}
                </span>
                <UiBadge :variant="varianteImpacto(critica.impacto)" size="sm">
                  {{ rotuloImpacto(critica.impacto) }}
                </UiBadge>
              </div>
              <p class="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-slate-800 dark:text-slate-100">
                {{ critica.titulo }}
              </p>
              <p
                v-if="critica.softwares.length || critica.parceiro"
                class="mt-0.5 line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400"
              >
                {{ [critica.softwares.join(' · '), critica.parceiro].filter(Boolean).join(' · ') }}
              </p>
            </div>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
