<script setup lang="ts">
import type { PublicoSelecao } from '#shared/publico'

const selecao = useState<PublicoSelecao | null>('publico-selecao', () => null)
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] p-6 sm:p-8">
    <div class="mx-auto max-w-3xl">
      <p class="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        Área Pública
      </p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {{ selecao ? selecao.titulo : 'Painel de Destaques & Busca' }}
      </h1>
      <p v-if="selecao" class="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {{ selecao.detalhe }}
      </p>
      <p v-else class="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Selecione uma release, um mês de manual ou um escopo na navegação lateral para explorar o
        conteúdo publicado.
      </p>

      <div class="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p class="text-sm font-medium text-slate-700 dark:text-slate-200">Conteúdo em preparação</p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          As páginas de destaque, release, manuais e escopo serão adicionadas em uma próxima
          entrega. A navegação já exibe apenas o conteúdo publicado.
        </p>
      </div>
    </div>
  </div>
</template>
