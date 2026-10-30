<script setup lang="ts">
import { ArrowLeft, CheckCircle2, FolderGit2, Monitor } from '@lucide/vue'
import {
  rotuloChamadas,
  rotuloSistemas,
  type PublicoEscopoDetalhe,
  type PublicoResumoEscopo
} from '#shared/publico'

const props = withDefaults(
  defineProps<{
    escopo: PublicoEscopoDetalhe
    resumo: PublicoResumoEscopo | null
    demo?: boolean
  }>(),
  { demo: false }
)

const chamadasProjeto = () => props.resumo?.chamadasProjeto ?? 0
const totalSistemas = () => props.resumo?.totalSistemas ?? 0
const sistemaSelecionado = () => props.resumo?.sistemaSelecionado ?? ''
const chamadasSistema = () => props.resumo?.chamadasSistema ?? 0
</script>

<template>
  <section aria-labelledby="escopo-titulo" class="min-w-0">
    <div
      class="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-brand-primary via-slate-950 to-indigo-950 p-5 text-slate-100 shadow-sm sm:p-7"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span
          v-if="escopo.versao"
          class="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-[11px] tabular-nums text-indigo-200"
        >
          Versão {{ escopo.versao }}
        </span>
        <span
          class="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-[11px] tabular-nums text-indigo-200"
        >
          Ano {{ escopo.ano }}
        </span>
        <span
          v-if="sistemaSelecionado()"
          class="inline-flex items-center gap-1.5 rounded-md border border-indigo-400/30 bg-indigo-500/15 px-2 py-1 text-[11px] font-semibold text-indigo-200"
        >
          <Monitor class="h-3.5 w-3.5" aria-hidden="true" />
          Sistema: {{ sistemaSelecionado() }}
        </span>

        <NuxtLink
          v-if="!demo"
          to="/"
          class="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-slate-100 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
        >
          <ArrowLeft class="h-3.5 w-3.5" aria-hidden="true" />
          Voltar aos Destaques
        </NuxtLink>
        <span
          v-else
          class="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-slate-100"
        >
          <ArrowLeft class="h-3.5 w-3.5" aria-hidden="true" />
          Voltar aos Destaques
        </span>
      </div>

      <h1
        id="escopo-titulo"
        class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl"
      >
        Escopo de Projetos: {{ escopo.nome }}
      </h1>
      <p class="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">
        Consulte abaixo as chamadas e demandas contempladas na governança do escopo de projetos.
        <template v-if="sistemaSelecionado()">
          Visualizando especificamente as chamadas contempladas do sistema
          {{ sistemaSelecionado() }}.
        </template>
        <template v-else>
          Visualizando todas as chamadas contempladas do projeto.
        </template>
      </p>

      <div
        class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-slate-300"
      >
        <span class="inline-flex items-center gap-1.5">
          <FolderGit2 class="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" />
          <strong class="font-mono tabular-nums text-slate-100">{{ rotuloChamadas(chamadasProjeto()) }}</strong>
          no projeto
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Monitor class="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" />
          <strong class="font-mono tabular-nums text-slate-100">{{ rotuloSistemas(totalSistemas()) }}</strong>
          contemplados
        </span>
        <span
          v-if="sistemaSelecionado()"
          class="inline-flex items-center gap-1.5 font-semibold text-emerald-300"
        >
          <CheckCircle2 class="h-3.5 w-3.5" aria-hidden="true" />
          {{ rotuloChamadas(chamadasSistema()) }} neste sistema
        </span>
      </div>
    </div>
  </section>
</template>
