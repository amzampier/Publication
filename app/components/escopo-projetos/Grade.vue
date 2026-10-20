<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ClipboardList, Import, Search, X, Funnel } from '@lucide/vue'
import { usePermissions } from '../../composables/usePermissions'
import {
  useEscopoProjetosModelo,
  type ProjetoEscopoModelo
} from './useEscopoProjetosModelo'

const { can } = usePermissions()

const emit = defineEmits<{
  (e: 'editar', escopo: ProjetoEscopoModelo): void
  (e: 'excluir', escopo: ProjetoEscopoModelo): void
  (e: 'publicar', escopo: ProjetoEscopoModelo): void
  (e: 'arquivar', escopo: ProjetoEscopoModelo): void
  (e: 'ver-itens', escopo: ProjetoEscopoModelo): void
  (e: 'open-filters'): void
}>()

const { escoposVisiveis, filtrosAtivosCount, busca } = useEscopoProjetosModelo()

const pagina = ref(1)
const porPagina = ref(6)
const OPCOES_PAGINA = [6, 12, 18, 24]

const totalPaginas = computed(() => Math.ceil(escoposVisiveis.value.length / porPagina.value) || 1)
const paginaAtual = computed(() => Math.min(pagina.value, totalPaginas.value))

const visiveisNaPagina = computed<ProjetoEscopoModelo[]>(() => {
  const inicio = (paginaAtual.value - 1) * porPagina.value
  return escoposVisiveis.value.slice(inicio, inicio + porPagina.value)
})

watch(
  () => [busca.value, filtrosAtivosCount.value, escoposVisiveis.value.length] as const,
  () => {
    pagina.value = 1
  }
)
</script>

<template>
  <section aria-label="Escopos de projetos cadastrados">
    <div class="rounded-xl border border-slate-200 bg-white shadow-xs">
      <div
        class="flex flex-col justify-between gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 shrink-0 rounded-lg border border-sky-200 bg-sky-50 p-2 text-sky-700">
            <ClipboardList class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              Escopo de Projetos
            </h3>
            <p class="mt-0.5 text-xs text-slate-500">
              Catálogo de escopos anuais, versões e softwares contemplados
            </p>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <div v-if="can('escopo-projetos', 'buscar')" class="w-full min-w-0 shrink-0 sm:w-64">
            <UiInput
              v-model="busca"
              placeholder="Buscar escopos..."
              :left-icon="Search"
              :right-icon="busca ? X : undefined"
              @right-icon-click="busca = ''"
            />
          </div>

          <UiTooltip
            v-if="can('escopo-projetos', 'importar')"
            content="Importar escopos (fase backend)"
            position="top"
          >
            <button
              type="button"
              aria-label="Importar escopos"
              class="inline-flex items-center justify-center rounded p-1 text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            >
              <Import class="h-4 w-4" />
            </button>
          </UiTooltip>

          <UiButton
            v-if="can('escopo-projetos', 'filtrar')"
            variant="outline"
            size="sm"
            class="shrink-0"
            @click="emit('open-filters')"
          >
            <template #leftIcon><Funnel class="h-3.5 w-3.5" /></template>
            Filtros
            <UiBadge v-if="filtrosAtivosCount > 0" variant="done" size="sm" class="ml-1.5">
              {{ filtrosAtivosCount }}
            </UiBadge>
          </UiButton>
        </div>
      </div>

      <div class="p-4">
        <div
          v-if="visiveisNaPagina.length"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <EscopoProjetosCard
            v-for="escopo in visiveisNaPagina"
            :key="escopo.id"
            :escopo="escopo"
            @ver-itens="emit('ver-itens', $event)"
            @editar="emit('editar', $event)"
            @excluir="emit('excluir', $event)"
            @publicar="emit('publicar', $event)"
            @arquivar="emit('arquivar', $event)"
          />
        </div>

        <div v-else class="py-12 text-center text-sm text-slate-400">
          {{
            filtrosAtivosCount > 0 || busca.trim() !== ''
              ? 'Nenhum resultado encontrado para o filtro.'
              : 'Nenhum escopo de projeto cadastrado.'
          }}
        </div>
      </div>

      <div v-if="escoposVisiveis.length" class="border-t border-slate-200 p-4">
        <UiPagination
          v-model="pagina"
          v-model:per-page="porPagina"
          :total="escoposVisiveis.length"
          :page-size-options="OPCOES_PAGINA"
          rotulo="escopos"
        />
      </div>
    </div>
  </section>
</template>
