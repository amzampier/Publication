<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Handshake, Import, Search, X, Funnel } from '@lucide/vue'
import { usePermissions } from '../../composables/usePermissions'
import { useParceirosModelo, type ParceiroModelo } from './useParceirosModelo'

const { can } = usePermissions()

// A grade abre o modal de filtros e emite edição/exclusão/importação para a
// página (dona da coordenação — molde SoftwaresTabela).
const emit = defineEmits<{
  (e: 'editar', parceiro: ParceiroModelo): void
  (e: 'excluir', parceiro: ParceiroModelo): void
  (e: 'importar'): void
  (e: 'open-filters'): void
}>()

const { parceirosVisiveis, filtrosAtivosCount, busca } = useParceirosModelo()

const pagina = ref(1)
const porPagina = ref(6)
const OPCOES_PAGINA = [6, 12, 18, 24]

const totalPaginas = computed(() => Math.ceil(parceirosVisiveis.value.length / porPagina.value) || 1)

const paginaAtual = computed(() => Math.min(pagina.value, totalPaginas.value))

const visiveisNaPagina = computed<ParceiroModelo[]>(() => {
  const inicio = (paginaAtual.value - 1) * porPagina.value
  return parceirosVisiveis.value.slice(inicio, inicio + porPagina.value)
})

// Volta à primeira página quando busca/filtros mudam o conjunto.
watch(
  () => [busca.value, filtrosAtivosCount.value, parceirosVisiveis.value.length] as const,
  () => {
    pagina.value = 1
  }
)
</script>

<template>
  <section aria-label="Parceiros cadastrados">
    <div class="rounded-xl border border-slate-200 bg-white shadow-xs">
      <!-- Topo: título + busca + Import + Filtros -->
      <div
        class="flex flex-col justify-between gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700">
            <Handshake class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold tracking-tight text-slate-900 sm:text-base">Parceiros</h3>
            <p class="mt-0.5 text-xs text-slate-500">
              Cadastro de parceiros clientes, redes e distribuidoras
            </p>
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <div v-if="can('parceiros', 'buscar')" class="w-full min-w-0 shrink-0 sm:w-64">
            <UiInput
              v-model="busca"
              placeholder="Buscar parceiros..."
              :left-icon="Search"
              :right-icon="busca ? X : undefined"
              @right-icon-click="busca = ''"
            />
          </div>

          <UiTooltip v-if="can('parceiros', 'importar')" content="Importar Parceiros" position="top">
            <button
              type="button"
              aria-label="Importar parceiros"
              class="inline-flex items-center justify-center rounded p-1 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('importar')"
            >
              <Import class="h-4 w-4" />
            </button>
          </UiTooltip>

          <UiButton v-if="can('parceiros', 'filtrar')" variant="outline" size="sm" class="shrink-0" @click="emit('open-filters')">
            <template #leftIcon><Funnel class="h-3.5 w-3.5" /></template>
            Filtros
            <UiBadge v-if="filtrosAtivosCount > 0" variant="done" size="sm" class="ml-1.5">
              {{ filtrosAtivosCount }}
            </UiBadge>
          </UiButton>
        </div>
      </div>

      <!-- Grade de cards -->
      <div class="p-4">
        <div
          v-if="visiveisNaPagina.length"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <ParceirosCard
            v-for="parceiro in visiveisNaPagina"
            :key="parceiro.id"
            :parceiro="parceiro"
            @editar="emit('editar', $event)"
            @excluir="emit('excluir', $event)"
          />
        </div>

        <div
          v-else
          class="py-12 text-center text-sm text-slate-400"
        >
          {{
            filtrosAtivosCount > 0 || busca.trim() !== ''
              ? 'Nenhum resultado encontrado para o filtro.'
              : 'Nenhum parceiro cadastrado.'
          }}
        </div>
      </div>

      <!-- Paginação (client-side) -->
      <div v-if="parceirosVisiveis.length" class="border-t border-slate-200 p-4">
        <UiPagination
          v-model="pagina"
          v-model:per-page="porPagina"
          :total="parceirosVisiveis.length"
          :page-size-options="OPCOES_PAGINA"
          rotulo="parceiros"
        />
      </div>
    </div>
  </section>
</template>
