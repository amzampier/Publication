<script setup lang="ts">
import { ref } from 'vue'
import { Eye, Import, Pencil, Search, ShieldCheck, Trash2, Undo2, XCircle } from '@lucide/vue'
import type { ColumnDef } from '../../utils/dataGrid'
import { VARIANTE_CHAMADA as VARIANTE_STATUS } from '#shared/status-badge'
import type { ActionMenuItem } from '../ui/ActionMenu.vue'
import { usePermissions } from '../../composables/usePermissions'
import {
  motivoBloqueioAprovacao,
  motivoBloqueioDesaprovacao,
  motivoBloqueioExclusao,
  motivoBloqueioRecusa,
  podeExcluir,
  useLancarChamadasModelo,
  type LinhaChamada,
  type StatusChamada
} from './useLancarChamadasModelo'

const emit = defineEmits<{
  (e: 'detalhes', linha: LinhaChamada): void
  (e: 'editar', linha: LinhaChamada): void
  (e: 'aprovar', linha: LinhaChamada): void
  (e: 'desaprovar', linha: LinhaChamada): void
  (e: 'recusar', linha: LinhaChamada): void
  (e: 'excluir', linha: LinhaChamada): void
  (e: 'importar'): void
  (e: 'open-filters'): void
}>()

const { can } = usePermissions()
const {
  linhas,
  carregando,
  busca,
  criteriosAtivosCount,
  resolver,
  pagina,
  porPagina,
  total,
  definirPagina,
  definirPorPagina,
  definirOrdenacao
} = useLancarChamadasModelo()

const tabelaRef = ref<{ focarBusca: () => void } | null>(null)
defineExpose({ focarBusca: () => tabelaRef.value?.focarBusca() })



const colunas: ColumnDef[] = [
  { id: 'chamada', header: 'Chamada', accessorKey: 'chamada', minWidth: 120 },
  { id: 'titulo', header: 'Título', accessorKey: 'titulo', minWidth: 250 },
  { id: 'software', header: 'Softwares', accessorKey: 'software', minWidth: 160 },
  { id: 'vinculo', header: 'Release', accessorKey: 'vinculo', minWidth: 150 },
  { id: 'tipo', header: 'Tipo', accessorKey: 'tipo', minWidth: 130 },
  { id: 'impacto', header: 'Impacto', accessorKey: 'impacto', minWidth: 100 },
  { id: 'status', header: 'Status', accessorKey: 'status', minWidth: 110 },
  { id: 'dataLancamentoIso', header: 'Lançamento', accessorKey: 'dataLancamentoIso', minWidth: 110 },
  { id: 'dataLiberacaoIso', header: 'Liberação', accessorKey: 'dataLiberacaoIso', minWidth: 110 }
]

const motivoExclusao = (linha: LinhaChamada): string | null => {
  const chamada = resolver(linha.id)
  if (!chamada) return 'Chamada não encontrada.'
  return podeExcluir(chamada) ? null : motivoBloqueioExclusao(chamada)
}

const acoesDaLinha = (linha: LinhaChamada): ActionMenuItem[] => {
  const itens: ActionMenuItem[] = []
  itens.push({ id: 'detalhes', label: 'Detalhes', icon: Eye })
  if (can('lancar-chamadas', 'publicar')) {
    const chamada = resolver(linha.id)
    const motivo = chamada ? motivoBloqueioAprovacao(chamada) : 'Chamada não encontrada.'
    itens.push({
      id: 'aprovar',
      label: 'Aprovar',
      icon: ShieldCheck,
      hoverText: '#047857',
      disabled: motivo !== null,
      reason: motivo ?? undefined
    })
  }
  if (can('lancar-chamadas', 'alterar')) {
    const chamada = resolver(linha.id)
    const motivoDesaprovar = chamada
      ? motivoBloqueioDesaprovacao(chamada)
      : 'Chamada não encontrada.'
    itens.push({
      id: 'desaprovar',
      label: chamada?.status === 'Recusado' ? 'Reabrir para Revisar' : 'Desaprovar',
      icon: Undo2,
      disabled: motivoDesaprovar !== null,
      reason: motivoDesaprovar ?? undefined
    })
    const motivo = chamada ? motivoBloqueioRecusa(chamada) : 'Chamada não encontrada.'
    itens.push({
      id: 'recusar',
      label: 'Recusar',
      icon: XCircle,
      tone: 'danger',
      disabled: motivo !== null,
      reason: motivo ?? undefined
    })
  }
  return itens
}

const acionar = (id: string, linha: LinhaChamada) => {
  if (id === 'detalhes') emit('detalhes', linha)
  else if (id === 'aprovar') emit('aprovar', linha)
  else if (id === 'desaprovar') emit('desaprovar', linha)
  else if (id === 'recusar') emit('recusar', linha)
}
</script>

<template>
  <section aria-label="Chamadas cadastradas">
    <UiLoading v-if="carregando" message="Atualizando chamadas..." class="mb-2" />

    <UiDataTable
      ref="tabelaRef"
      title="Chamadas"
      subtitle="Itens lan&#231;ados, seus v&#237;nculos e o status de cada entrega"
      :data="linhas"
      :columns="colunas"
      :default-page-size="10"
      :page-size-options="[10, 20, 50]"
      server-mode
      :page="pagina"
      :per-page="porPagina"
      :total="total"
      show-header-top
      :show-search="false"
      :show-filters="can('lancar-chamadas', 'filtrar')"
      :filters-count="criteriosAtivosCount"
      sticky-actions
      @page-change="definirPagina"
      @per-page-change="definirPorPagina"
      @sort-change="definirOrdenacao"
      @open-filters="emit('open-filters')"
    >
      <template #filtersLeft>
        <div v-if="can('lancar-chamadas', 'buscar')" class="w-full min-w-0 sm:w-64">
          <UiInput
            v-model="busca"
            label="Buscar chamadas"
            label-class="sr-only"
            placeholder="Buscar chamadas..."
            :left-icon="Search"
          />
        </div>
        <UiTooltip v-if="can('lancar-chamadas', 'importar')" content="Importar Chamadas" position="top">
          <button
            type="button"
            aria-label="Importar chamadas"
            class="inline-flex items-center justify-center rounded p-1 text-slate-500 transition-colors hover:bg-lime-50 hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="emit('importar')"
          >
            <Import class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>

      <template #cell(chamada)="{ row }">
        <button
          type="button"
          class="font-mono text-left text-[11px] font-medium tabular-nums text-brand-structure underline-offset-2 hover:text-brand-focus hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
          :aria-label="`Ver detalhes da chamada ${row.chamada}`"
          @click="emit('detalhes', row)"
        >
          {{ row.chamada }}
        </button>
      </template>

      <template #cell(status)="{ value }">
        <UiBadge :variant="VARIANTE_STATUS[value as StatusChamada]" size="sm" :show-icon="false">
          {{ value }}
        </UiBadge>
      </template>

      <template #cell(software)="{ row }">
        <div class="flex flex-col gap-0.5 whitespace-normal">
          <span v-for="nome in row.softwares" :key="nome">{{ nome }}</span>
          <span v-if="!row.softwares.length" class="text-slate-500">—</span>
        </div>
      </template>

      <template #cell(vinculo)="{ row }">
        <div class="flex flex-col gap-0.5 whitespace-normal font-mono text-[10px] text-slate-600">
          <span v-for="codigo in row.vinculos" :key="codigo">{{ codigo }}</span>
          <span v-if="!row.vinculos.length" class="text-slate-500">—</span>
        </div>
      </template>

      <template #cell(dataLancamentoIso)="{ row }">
        <span class="font-mono tabular-nums">{{ row.dataLancamento }}</span>
      </template>

      <template #cell(dataLiberacaoIso)="{ row }">
        <span class="font-mono tabular-nums">{{ row.dataLiberacao }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1">
          <UiTooltip v-if="can('lancar-chamadas', 'alterar')" content="Editar chamada" position="top">
            <button
              type="button"
              aria-label="Editar chamada"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 transition-colors hover:bg-lime-50 hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('editar', row)"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>

          <UiTooltip
            v-if="can('lancar-chamadas', 'excluir')"
            :content="motivoExclusao(row) ?? 'Excluir chamada'"
            position="top"
          >
            <button
              type="button"
              :disabled="motivoExclusao(row) !== null"
              :aria-label="
                motivoExclusao(row)
                  ? `Excluir chamada — ${motivoExclusao(row)}`
                  : 'Excluir chamada'
              "
              :title="motivoExclusao(row) ?? 'Excluir chamada'"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
              @click="emit('excluir', row)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>

          <UiActionMenu
            :items="acoesDaLinha(row)"
            :label="`Mais ações da chamada ${row.chamada}`"
            @select="(id) => acionar(id, row)"
          />
        </div>
      </template>
    </UiDataTable>
  </section>
</template>
