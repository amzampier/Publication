<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Pencil, Send, Archive, Trash2, Import } from '@lucide/vue'
import type { ColumnDef } from '../../utils/dataGrid'
import { VARIANTE_RELEASE as VARIANTE_STATUS } from '#shared/status-badge'
import type { ActionMenuItem } from '../ui/ActionMenu.vue'
import { usePermissions } from '../../composables/usePermissions'
import { useReleaseWeekModelo, type LinhaReleaseWeek, type StatusRelease } from './useReleaseWeekModelo'

const { can } = usePermissions()
const { linhas, filtrosAtivosCount } = useReleaseWeekModelo()

const emit = defineEmits<{
  (e: 'editar', linha: LinhaReleaseWeek): void
  (e: 'clonar', linha: LinhaReleaseWeek): void
  (e: 'publicar', linha: LinhaReleaseWeek): void
  (e: 'arquivar', linha: LinhaReleaseWeek): void
  (e: 'excluir', linha: LinhaReleaseWeek): void
  (e: 'importar'): void
  (e: 'open-filters'): void
}>()

// Encadeia o foco da busca do kit (usado quando a linha do gatilho sai do DOM).
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)
defineExpose({ focarBusca: () => tabelaRef.value?.focarBusca() })

// Flag do cabeçalho: liga/desliga os controles "+" de cada release.
const exibirItens = ref(false)
const linhasExpandidas = ref<string[]>([])
const alternarExibirItens = (e: Event) => {
  exibirItens.value = (e.target as HTMLInputElement).checked
  if (!exibirItens.value) linhasExpandidas.value = []
}



const colunas: ColumnDef[] = [
  { id: 'codigo', header: 'Código', accessorKey: 'codigo', minWidth: 110 },
  { id: 'nome', header: 'Nome', accessorKey: 'nome', minWidth: 230 },
  { id: 'semanaAno', header: 'Semana/Ano', accessorKey: 'semanaAno', minWidth: 130 },
  { id: 'periodo', header: 'Período', accessorKey: 'periodo', minWidth: 180 },
  { id: 'status', header: 'Status', accessorKey: 'status', minWidth: 110 },
  { id: 'autor', header: 'Autor', accessorKey: 'autor', minWidth: 150 },
  { id: 'dataPublicacao', header: 'Publicação', accessorKey: 'dataPublicacao', minWidth: 110 }
]

const motivoExclusao = (linha: LinhaReleaseWeek): string | null =>
  linha.itensCount > 0 ? 'Release com itens vinculados não pode ser excluída.' : null

// Editar e Excluir ficam FORA do menu (ícones à esquerda dos três pontinhos);
// o menu agrupa as ações de fluxo (Clonar/Publicar/Arquivar).
const acoesDaLinha = (linha: LinhaReleaseWeek): ActionMenuItem[] => {
  const itens: ActionMenuItem[] = []

  if (can('release-week', 'criar')) {
    itens.push({
      id: 'clonar',
      label: 'Clonar',
      icon: Copy,
      hoverText: '#4338ca'
    })
  }
  if (can('release-week', 'publicar')) {
    const publicada = linha.status === 'Publicado'
    itens.push({
      id: 'publicar',
      label: 'Publicar',
      icon: Send,
      hoverText: '#047857',
      disabled: publicada,
      reason: publicada ? 'Release já publicada.' : undefined
    })
  }
  if (can('release-week', 'arquivar')) {
    itens.push({
      id: 'arquivar',
      label: 'Arquivar',
      icon: Archive,
      hoverText: '#0364f7'
    })
  }

  return itens
}

const acionar = (id: string, linha: LinhaReleaseWeek) => {
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
  <section aria-label="Release Weeks cadastradas">
    <UiDataTable
      ref="tabelaRef"
      title="Release Weeks"
      subtitle="Cabeçalho das semanas de entrega e seus itens"
      :data="linhas"
      :columns="colunas"
      :default-page-size="5"
      show-header-top
      :show-search="can('release-week', 'buscar')"
      :show-filters="can('release-week', 'filtrar')"
      :filters-count="filtrosAtivosCount"
      :expandable="exibirItens"
      v-model:expanded="linhasExpandidas"
      row-key="id"
      expand-label="Exibir itens da release"
      @open-filters="emit('open-filters')"
    >
      <template #filtersLeft>
        <UiTooltip v-if="can('release-week', 'importar')" content="Importar Release Weeks" position="top">
          <button
            type="button"
            aria-label="Importar Release Weeks"
            class="inline-flex items-center justify-center rounded p-1 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="emit('importar')"
          >
            <Import class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>

      <template #expandHeader>
        <input
          type="checkbox"
          :checked="exibirItens"
          aria-label="Exibir itens das releases"
          title="Exibir itens"
          class="h-3.5 w-3.5 cursor-pointer accent-brand-accent"
          @change="alternarExibirItens"
        >
      </template>

      <template #cell(status)="{ value }">
        <UiBadge :variant="VARIANTE_STATUS[value as StatusRelease]" size="sm">
          {{ value }}
        </UiBadge>
      </template>

      <template #cell(dataPublicacao)="{ value }">
        <span class="font-mono tabular-nums">{{ value }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1">
          <UiTooltip v-if="can('release-week', 'alterar')" content="Editar release" position="top">
            <button
              type="button"
              aria-label="Editar release"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:text-brand-focus hover:bg-lime-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('editar', row)"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>

          <UiTooltip
            v-if="can('release-week', 'excluir')"
            :content="motivoExclusao(row) ?? 'Excluir release'"
            position="top"
          >
            <button
              type="button"
              :disabled="motivoExclusao(row) !== null"
              :aria-label="
                motivoExclusao(row) ? `Excluir release — ${motivoExclusao(row)}` : 'Excluir release'
              "
              :title="motivoExclusao(row) ?? 'Excluir release'"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              @click="emit('excluir', row)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>

          <UiActionMenu
            v-if="acoesDaLinha(row).length"
            :items="acoesDaLinha(row)"
            :label="`Mais ações da release ${row.codigo}`"
            @select="(id) => acionar(id, row)"
          />
        </div>
      </template>

      <template #expanded="{ row }">
        <ReleaseWeekItens :release-id="row.id" :codigo="row.codigo" />
      </template>
    </UiDataTable>
  </section>
</template>
