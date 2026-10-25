<script setup lang="ts">
import { ref } from 'vue'
import { Import, Pencil, Trash2 } from '@lucide/vue'
import { type ColumnDef } from '../../utils/dataGrid'
import { usePermissions } from '../../composables/usePermissions'
import {
  useSoftwaresModelo,
  VARIANTE_POR_SITUACAO,
  type LinhaSoftware,
  type SituacaoSoftware
} from './useSoftwaresModelo'

const { can } = usePermissions()

// A tabela só abre o modal de filtros; edição/exclusão são emitidas para a
// página (dona da coordenação — molde PerfisTabela).
const emit = defineEmits<{
  (e: 'editar', software: LinhaSoftware): void
  (e: 'excluir', software: LinhaSoftware): void
  (e: 'importar'): void
  (e: 'open-filters'): void
}>()

// Encadeia o foco da busca do kit (usado quando a linha do gatilho sai do DOM).
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)
defineExpose({ focarBusca: () => tabelaRef.value?.focarBusca() })

const { linhas, filtrosAtivosCount } = useSoftwaresModelo()

const colunas: ColumnDef[] = [
  { id: 'codigo', header: 'Código', accessorKey: 'codigo', minWidth: 100 },
  { id: 'descricao', header: 'Descrição', accessorKey: 'descricao', minWidth: 220 },
  { id: 'categoria', header: 'Categoria', accessorKey: 'categoria', minWidth: 130 },
  { id: 'situacao', header: 'Situação', accessorKey: 'situacao', minWidth: 110 },
  { id: 'criadoEm', header: 'Criado em', accessorKey: 'criadoEm', minWidth: 150 },
  { id: 'atualizadoEm', header: 'Atualizado em', accessorKey: 'atualizadoEm', minWidth: 150 }
]
</script>

<template>
  <section aria-label="Softwares cadastrados">
    <UiDataTable
      ref="tabelaRef"
      title="Softwares"
      subtitle="Catálogo de softwares corporativos"
      :data="linhas"
      :columns="colunas"
      :default-page-size="5"
      show-header-top
      :show-search="can('softwares', 'buscar')"
      :show-filters="can('softwares', 'filtrar')"
      :filters-count="filtrosAtivosCount"
      @open-filters="emit('open-filters')"
    >
      <template #filtersLeft>
        <UiTooltip v-if="can('softwares', 'importar')" content="Importar Softwares" position="top">
          <button
            type="button"
            aria-label="Importar softwares"
            class="inline-flex items-center justify-center rounded p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="emit('importar')"
          >
            <Import class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>

      <template #cell(categoria)="{ value }">
        <UiBadge variant="neutral" size="sm" :show-icon="false">
          {{ value }}
        </UiBadge>
      </template>

      <template #cell(situacao)="{ value }">
        <UiBadge :variant="VARIANTE_POR_SITUACAO[value as SituacaoSoftware]" size="sm">
          {{ value }}
        </UiBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-[7px]">
          <UiTooltip v-if="can('softwares', 'alterar')" content="Editar software" position="top">
            <button
              type="button"
              aria-label="Editar software"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 hover:text-brand-focus hover:bg-lime-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('editar', row)"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>

          <UiTooltip v-if="can('softwares', 'excluir')" content="Excluir software" position="top">
            <button
              type="button"
              aria-label="Excluir software"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('excluir', row)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>
        </div>
      </template>
    </UiDataTable>
  </section>
</template>
