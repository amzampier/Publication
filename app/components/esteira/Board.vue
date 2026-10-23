<script setup lang="ts">
import { computed } from 'vue'
import { FileSpreadsheet, Funnel, Layers, Search, X } from '@lucide/vue'
import { usePermissions } from '../../composables/usePermissions'
import {
  useEsteiraRevisaoModelo,
  type LinhaEsteira
} from './useEsteiraRevisaoModelo'

const emit = defineEmits<{
  (e: 'detalhes', linha: LinhaEsteira): void
  (e: 'aprovar', linha: LinhaEsteira): void
  (e: 'recusar', linha: LinhaEsteira): void
  (e: 'reabrir', linha: LinhaEsteira): void
  (e: 'publicar', linha: LinhaEsteira): void
  (e: 'suspender', linha: LinhaEsteira): void
  (e: 'open-filters'): void
}>()

const { can } = usePermissions()
const {
  linhas,
  busca,
  filtros,
  mostrarRecusadas,
  criteriosAtivosCount,
  contagemPorOrigem,
  opcoesPacotes,
  pacoteSelecionado,
  aplicarPacote,
  limparFiltros,
  filtrarPorOrigem,
  progresso
} = useEsteiraRevisaoModelo()

const opcoesPacote = computed(() =>
  opcoesPacotes.value.map((opcao) => ({ value: opcao.id, label: opcao.label }))
)

const opcoesOrigem = computed(() => [
  { value: '', label: `Todas (${contagemPorOrigem.value[''] ?? 0})`, tone: 'navy' as const },
  { value: 'Release', label: `Releases (${contagemPorOrigem.value.Release ?? 0})`, tone: 'sky' as const },
  { value: 'Manual', label: `Manuais (${contagemPorOrigem.value.Manual ?? 0})`, tone: 'emerald' as const },
  { value: 'Projeto', label: `Escopo (${contagemPorOrigem.value.Projeto ?? 0})`, tone: 'indigo' as const }
])

const colunas = computed(() => [
  {
    id: 'Revisar',
    numero: '1.',
    titulo: 'Em Revisão',
    descricao: 'Chamadas aguardando homologação do Revisor / QA',
    cor: '#f59e0b',
    itens: linhas.value.filter((linha) => linha.status === 'Revisar')
  },
  {
    id: 'Aprovado',
    numero: '2.',
    titulo: 'Aprovado',
    descricao: 'Validadas pelo QA, prontas para publicação',
    cor: '#1a9e07',
    itens: linhas.value.filter((linha) => linha.status === 'Aprovado')
  },
  {
    id: 'Publicar',
    numero: '3.',
    titulo: 'Publicados',
    descricao: 'Aguardando o pai ou já visíveis no portal; filtre o vínculo para consultar',
    cor: '#0364f7',
    itens: linhas.value.filter(
      (linha) => linha.status === 'Publicar' || linha.status === 'Publicado'
    )
  }
])

const recusadas = computed(() => linhas.value.filter((linha) => linha.status === 'Recusado'))
</script>

<template>
  <section aria-label="Board da Esteira de Revisão">
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-start gap-3">
          <div class="mt-0.5 shrink-0 rounded-lg border border-brand-accent/30 bg-brand-accent/10 p-2 text-brand-focus">
            <FileSpreadsheet class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h2 class="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              Chamadas da esteira
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">
              Fila unificada de Release Week, Manuais e Escopo de Projetos
            </p>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <div v-if="can('esteira-revisao', 'buscar')" class="w-full min-w-0 sm:w-56">
            <UiInput
              v-model="busca"
              label="Buscar chamadas"
              label-class="sr-only"
              placeholder="Buscar chamada, tag..."
              :left-icon="Search"
            />
          </div>

          <UiSelect
            :model-value="pacoteSelecionado"
            :options="opcoesPacote"
            aria-label="Pacote de Origem"
            placeholder="Todos os Pacotes"
            class="w-full sm:w-56"
            @update:model-value="aplicarPacote(String($event))"
          />

          <UiButton
            v-if="can('esteira-revisao', 'filtrar')"
            variant="outline"
            size="sm"
            class="shrink-0"
            @click="emit('open-filters')"
          >
            <template #leftIcon><Funnel class="h-3.5 w-3.5" /></template>
            Filtros
            <UiBadge v-if="criteriosAtivosCount > 0" variant="done" size="sm" class="ml-1.5">
              {{ criteriosAtivosCount }}
            </UiBadge>
          </UiButton>

          <UiTooltip
            v-if="criteriosAtivosCount > 0"
            content="Limpar filtros e busca"
            position="top"
          >
            <button
              type="button"
              class="inline-flex items-center justify-center rounded p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              aria-label="Limpar filtros e busca"
              @click="limparFiltros(); busca = ''"
            >
              <X class="h-4 w-4" />
            </button>
          </UiTooltip>
        </div>
      </div>

      <div class="border-t border-slate-200 bg-slate-50/50 p-4">
        <div class="grid gap-3 lg:grid-cols-[1fr_20rem] lg:items-center">
          <div class="flex flex-col gap-2">
            <div class="flex items-start gap-2">
              <Layers class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Demandas por origem
                </p>
                <p class="text-[10px] text-slate-500">
                  Filtre o board por pacote de origem.
                </p>
              </div>
            </div>
            <UiSegmented
              :model-value="filtros.origem"
              :options="opcoesOrigem"
              label="Origem das demandas"
              label-class="sr-only"
              class="w-full sm:w-auto"
              @update:model-value="filtrarPorOrigem(String($event))"
            />
          </div>

          <EsteiraProgresso :progresso="progresso" />
        </div>
      </div>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-3">
      <section
        v-for="coluna in colunas"
        :key="coluna.id"
        class="flex min-h-[16rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70"
      >
        <header
          class="border-l-[2.5px] bg-gradient-to-r from-brand-primary to-brand-structure px-4 py-3 text-white"
          :style="{ borderLeftColor: coluna.cor }"
        >
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-bold text-white">
              <span class="mr-1 text-white/60">{{ coluna.numero }}</span>
              {{ coluna.titulo }}
            </h2>
            <span class="rounded-md border border-white/20 bg-white/15 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-white">
              {{ coluna.itens.length }}
            </span>
          </div>
          <p class="mt-0.5 text-[10px] leading-snug text-white/80">{{ coluna.descricao }}</p>
        </header>

        <div class="flex flex-1 flex-col gap-3 p-2.5">
          <EsteiraChamadaCard
            v-for="linha in coluna.itens"
            :key="linha.id"
            :linha="linha"
            @detalhes="emit('detalhes', $event)"
            @aprovar="emit('aprovar', $event)"
            @recusar="emit('recusar', $event)"
            @reabrir="emit('reabrir', $event)"
            @publicar="emit('publicar', $event)"
            @suspender="emit('suspender', $event)"
          />
          <p
            v-if="!coluna.itens.length"
            class="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-400"
          >
            Nenhuma chamada nesta etapa.
          </p>
        </div>
      </section>
    </div>

    <section
      v-if="mostrarRecusadas && recusadas.length"
      class="mt-4 overflow-hidden rounded-xl border border-rose-200 bg-rose-50/40"
      aria-label="Chamadas recusadas"
    >
      <header class="border-l-[2.5px] border-l-rose-700 bg-gradient-to-r from-brand-primary to-brand-structure px-4 py-3 text-white">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-bold text-white">Recusadas</h2>
          <span class="rounded-md border border-white/20 bg-white/15 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-white">
            {{ recusadas.length }}
          </span>
        </div>
        <p class="mt-0.5 text-[10px] leading-snug text-white/80">
          Aguardando correção do autor; reabra para devolver à fila de revisão.
        </p>
      </header>
      <div class="grid gap-3 p-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <EsteiraChamadaCard
          v-for="linha in recusadas"
          :key="linha.id"
          :linha="linha"
          @detalhes="emit('detalhes', $event)"
          @aprovar="emit('aprovar', $event)"
          @recusar="emit('recusar', $event)"
          @reabrir="emit('reabrir', $event)"
          @publicar="emit('publicar', $event)"
          @suspender="emit('suspender', $event)"
        />
      </div>
    </section>

    <p
      v-if="!linhas.length"
      class="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500"
    >
      {{ criteriosAtivosCount > 0 ? 'Nenhum resultado encontrado para o filtro.' : 'Nenhuma chamada no fluxo.' }}
    </p>
  </section>
</template>
