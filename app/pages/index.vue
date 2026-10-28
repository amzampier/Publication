<script setup lang="ts">
import { computed } from 'vue'
import { normalizarTipo } from '#shared/publico'
import { usePublicoPainel } from '../composables/usePublicoPainel'

const {
  painel,
  carregandoPainel,
  erroPainel,
  recarregarPainel,
  historico,
  carregandoHistorico,
  carregandoMais,
  erroHistorico,
  recarregarHistorico,
  carregarMais,
  temMais,
  filtros,
  limparFiltros
} = usePublicoPainel()

const temDadosPainel = computed(
  () =>
    Boolean(painel.value.releaseDestaque) ||
    painel.value.manuaisDestaque.length > 0 ||
    painel.value.maisVistas.length > 0
)

const rotuloHero = computed(() =>
  painel.value.releaseDestaque?.destaqueSemana
    ? 'Última Release Liberada da Semana'
    : 'Última Release Publicada'
)

const atualizarSoftware = (valor: string) => {
  filtros.software = valor
}

const atualizarTipo = (valor: string) => {
  filtros.tipo = normalizarTipo(valor)
}

useHead({
  title: 'Painel de Destaques & Busca - Dicas Teorema',
  meta: [
    {
      name: 'description',
      content:
        'Acompanhe a release da semana, os manuais em destaque e o histórico de Releases Week da Dicas Teorema.'
    }
  ]
})
</script>

<template>
  <div class="mx-auto max-w-[85rem] px-4 py-6 sm:px-6 lg:px-8">
    <h1 class="sr-only">Painel de Destaques &amp; Busca</h1>

    <UiErrorState
      v-if="erroPainel"
      :message="erroPainel"
      @retry="recarregarPainel"
    />

    <div
      v-else-if="carregandoPainel && !temDadosPainel"
      class="space-y-4"
      aria-busy="true"
    >
      <span class="sr-only">Carregando painel de destaques…</span>
      <div class="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 lg:col-span-2"></div>
        <div class="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </div>

    <template v-else>
      <PublicoPainelUltimaRelease
        :release="painel.releaseDestaque"
        :rotulo="rotuloHero"
      />

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <div class="min-w-0 lg:col-span-2">
          <PublicoPainelManuaisDestaque :manuais="painel.manuaisDestaque" />
        </div>
        <div class="min-w-0">
          <PublicoPainelMaisVistas
            :releases="painel.maisVistas"
            :modo="painel.modoMaisVistas"
          />
        </div>
      </div>

      <div class="mt-8">
        <PublicoPainelHistorico
          :itens="historico.itens"
          :total="historico.total"
          :pagina="historico.pagina"
          :por-pagina="historico.porPagina"
          :software="filtros.software"
          :tipo="filtros.tipo"
          :opcoes="painel.filtros"
          :carregando="carregandoHistorico"
          :carregando-mais="carregandoMais"
          :erro="erroHistorico"
          :tem-mais="temMais"
          @update:software="atualizarSoftware"
          @update:tipo="atualizarTipo"
          @limpar="limparFiltros"
          @carregar-mais="carregarMais"
          @recarregar="recarregarHistorico"
        />
      </div>
    </template>
  </div>
</template>
