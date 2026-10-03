<script setup lang="ts">
import { Eye } from '@lucide/vue'
import { type ColumnDef } from '../../utils/dataGrid'
import {
  useAuditoriaDemo,
  formatarDataHora,
  VARIANTE_POR_ACAO,
  type RegistroAuditoria
} from './useAuditoriaDemo'

const emit = defineEmits<{
  (e: 'open-filters'): void
  (e: 'open-details', registro: RegistroAuditoria): void
}>()

const { registrosFiltrados, filtrosAtivosCount } = useAuditoriaDemo()

const colunas: ColumnDef[] = [
  { id: 'dataHora', header: 'Data / Hora', accessorKey: 'registradoEm', minWidth: 130, format: (v) => formatarDataHora(v) },
  { id: 'usuario', header: 'Usuário', accessorKey: 'usuario', minWidth: 160, format: (v) => v.nome },
  { id: 'acao', header: 'Ação', accessorKey: 'acao', minWidth: 120 },
  { id: 'recurso', header: 'Recurso', accessorKey: 'recurso', minWidth: 140 },
  { id: 'detalhes', header: 'Detalhes', accessorKey: 'detalhes', minWidth: 220 },
  { id: 'ip', header: 'IP de Origem', accessorKey: 'ip', minWidth: 120 }
]
</script>

<template>
  <section aria-label="Registros de auditoria">
    <UiDataTable
      title="Registros de Auditoria"
      subtitle="Ordenados do mais recente para o mais antigo — fase 1 em memória"
      :data="registrosFiltrados"
      :columns="colunas"
      :default-page-size="5"
      show-header-top
      show-filters
      :filters-count="filtrosAtivosCount"
      @open-filters="emit('open-filters')"
    >
      <template #cell(acao)="{ value }">
        <UiBadge :variant="VARIANTE_POR_ACAO[value]" size="sm">
          {{ value }}
        </UiBadge>
      </template>

      <template #actions="{ row }">
        <UiTooltip content="Ver detalhes" position="top">
          <button
            type="button"
            aria-label="Ver detalhes do registro"
            class="inline-flex items-center justify-center rounded p-1 text-slate-500 hover:text-brand-primary hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="emit('open-details', row)"
          >
            <Eye class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>
    </UiDataTable>
  </section>
</template>