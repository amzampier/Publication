<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Pencil, Send, Archive, Trash2, Import, Star, CalendarDays } from '@lucide/vue'
import type { ColumnDef } from '../../utils/dataGrid'
import type { ActionMenuItem } from '../ui/ActionMenu.vue'
import { usePermissions } from '../../composables/usePermissions'
import {
  useManuaisModelo,
  type LinhaManual,
  type StatusManual
} from './useManuaisModelo'

const { can } = usePermissions()
const { linhas, filtrosAtivosCount } = useManuaisModelo()

const emit = defineEmits<{
  (e: 'editar', linha: LinhaManual): void
  (e: 'clonar', linha: LinhaManual): void
  (e: 'publicar', linha: LinhaManual): void
  (e: 'arquivar', linha: LinhaManual): void
  (e: 'excluir', linha: LinhaManual): void
  (e: 'importar'): void
  (e: 'open-filters'): void
}>()

const podeVerItens = computed(() => can('manuais', 'visualizar_itens'))

// Encadeia o foco da busca do kit (usado quando a linha do gatilho sai do DOM).
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)
defineExpose({ focarBusca: () => tabelaRef.value?.focarBusca() })

// Flag do cabeçalho: liga/desliga os controles "+" de cada catálogo.
const exibirItens = ref(false)
const linhasExpandidas = ref<string[]>([])
const alternarExibirItens = (e: Event) => {
  exibirItens.value = (e.target as HTMLInputElement).checked
  if (!exibirItens.value) linhasExpandidas.value = []
}

const VARIANTE_STATUS: Record<
  StatusManual,
  'neutral' | 'inReview' | 'alteracoes' | 'reconciled' | 'publicado'
> = {
  Rascunho: 'neutral',
  'Em Revisão': 'inReview',
  'Alterações Solicitadas': 'alteracoes',
  Aprovado: 'reconciled',
  Publicado: 'publicado'
}

const colunas: ColumnDef[] = [
  { id: 'codigo', header: 'Código', accessorKey: 'codigo', minWidth: 110 },
  { id: 'titulo', header: 'Título', accessorKey: 'titulo', minWidth: 240 },
  { id: 'mesAno', header: 'Mês/Ano', accessorKey: 'mesAno', minWidth: 130 },
  { id: 'status', header: 'Status', accessorKey: 'status', minWidth: 140 },
  { id: 'autor', header: 'Autor', accessorKey: 'autor', minWidth: 150 },
  { id: 'dataPublicacao', header: 'Publicação', accessorKey: 'dataPublicacao', minWidth: 110 }
]

const motivoExclusao = (linha: LinhaManual): string | null =>
  linha.itensCount > 0 ? 'Catálogo com itens vinculados não pode ser excluído.' : null

// Editar e Excluir ficam FORA do menu (ícones à esquerda dos três pontinhos);
// o menu agrupa as ações de fluxo (Clonar/Publicar/Arquivar).
const acoesDaLinha = (linha: LinhaManual): ActionMenuItem[] => {
  const itens: ActionMenuItem[] = []

  if (can('manuais', 'clonar')) {
    itens.push({
      id: 'clonar',
      label: 'Clonar',
      icon: Copy,
      hoverText: '#4338ca'
    })
  }
  if (can('manuais', 'publicar')) {
    const publicado = linha.status === 'Publicado'
    itens.push({
      id: 'publicar',
      label: 'Publicar',
      icon: Send,
      hoverText: '#047857',
      disabled: publicado,
      reason: publicado ? 'Catálogo já publicado.' : undefined
    })
  }
  if (can('manuais', 'arquivar')) {
    itens.push({
      id: 'arquivar',
      label: 'Arquivar',
      icon: Archive,
      hoverText: '#0364f7'
    })
  }

  return itens
}

const acionar = (id: string, linha: LinhaManual) => {
  switch (id) {
    case 'clonar':
      emit('clonar', linha)
      break
    case 'publicar':
      emit('publicar', linha)
      break
    case 'arquivar':
      emit('arquivar', linha)
      break
  }
}
</script>

<template>
  <section aria-label="Manuais Mensais cadastrados">
    <UiDataTable
      ref="tabelaRef"
      title="Manuais Mensais"
      subtitle="Catálogo mensal de manuais e seus itens"
      :data="linhas"
      :columns="colunas"
      :default-page-size="5"
      show-header-top
      :show-search="can('manuais', 'buscar')"
      :show-filters="can('manuais', 'filtrar')"
      :filters-count="filtrosAtivosCount"
      :expandable="podeVerItens && exibirItens"
      v-model:expanded="linhasExpandidas"
      row-key="id"
      expand-label="Exibir itens do manual"
      @open-filters="emit('open-filters')"
    >
      <template #filtersLeft>
        <UiTooltip v-if="can('manuais', 'importar')" content="Importar Manuais" position="top">
          <button
            type="button"
            aria-label="Importar Manuais"
            class="inline-flex items-center justify-center rounded p-1 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="emit('importar')"
          >
            <Import class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>

      <template v-if="podeVerItens" #expandHeader>
        <input
          type="checkbox"
          :checked="exibirItens"
          aria-label="Exibir itens dos manuais"
          title="Exibir itens"
          class="h-3.5 w-3.5 cursor-pointer accent-brand-accent"
          @change="alternarExibirItens"
        >
      </template>

      <template #cell(titulo)="{ value, row }">
        <div class="flex items-center gap-1.5">
          <span class="min-w-0">{{ value }}</span>
          <UiTooltip v-if="row.destaqueMes" content="Destaque do mês" position="top">
            <Star class="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" aria-label="Destaque do mês" />
          </UiTooltip>
          <UiTooltip v-if="row.destaqueSemana" content="Destaque da semana" position="top">
            <CalendarDays class="h-3.5 w-3.5 shrink-0 text-sky-600" aria-label="Destaque da semana" />
          </UiTooltip>
        </div>
      </template>

      <template #cell(status)="{ value }">
        <UiBadge :variant="VARIANTE_STATUS[value as StatusManual]" size="sm">
          {{ value }}
        </UiBadge>
      </template>

      <template #cell(dataPublicacao)="{ value }">
        <span class="font-mono tabular-nums">{{ value }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1">
          <UiTooltip v-if="can('manuais', 'alterar')" content="Editar manual" position="top">
            <button
              type="button"
              aria-label="Editar manual"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:text-brand-focus hover:bg-lime-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('editar', row)"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>

          <UiTooltip
            v-if="can('manuais', 'excluir')"
            :content="motivoExclusao(row) ?? 'Excluir manual'"
            position="top"
          >
            <button
              type="button"
              :disabled="motivoExclusao(row) !== null"
              :aria-label="
                motivoExclusao(row)
                  ? `Excluir manual — ${motivoExclusao(row)}`
                  : 'Excluir manual'
              "
              :title="motivoExclusao(row) ?? 'Excluir manual'"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              @click="emit('excluir', row)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>

          <UiActionMenu
            v-if="acoesDaLinha(row).length"
            :items="acoesDaLinha(row)"
            :label="`Mais ações do manual ${row.codigo}`"
            @select="(id) => acionar(id, row)"
          />
        </div>
      </template>

      <template #expanded="{ row }">
        <ManuaisItens :manual-id="row.id" :codigo="row.codigo" />
      </template>
    </UiDataTable>
  </section>
</template>
