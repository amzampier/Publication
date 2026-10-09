<script setup lang="ts">
import { ref } from 'vue'
import { KeyRound, Pencil, Trash2 } from '@lucide/vue'
import { type ColumnDef } from '../../utils/dataGrid'
import { usePerfisDemo, VARIANTE_POR_STATUS, type LinhaPerfil } from './usePerfisDemo'

// Abre modais na página (coordenação dela): cadastro/edição e exclusão têm modal;
// permissões continua em transição por toast (spec perfis-acesso)
const emit = defineEmits<{
  (e: 'permissoes', perfil: LinhaPerfil): void
  (e: 'editar', perfil: LinhaPerfil): void
  (e: 'excluir', perfil: LinhaPerfil): void
  (e: 'open-filters'): void
}>()

// Encadeia o foco da busca do kit (usado quando a linha do gatilho sai do DOM)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)
defineExpose({ focarBusca: () => tabelaRef.value?.focarBusca() })

const { linhas, filtrosAtivosCount } = usePerfisDemo()

const colunas: ColumnDef[] = [
  { id: 'nome', header: 'Nome', accessorKey: 'nome', minWidth: 150 },
  { id: 'descricao', header: 'Descrição', accessorKey: 'descricao', minWidth: 240 },
  { id: 'usuarios', header: 'Usuários', accessorKey: 'usuarios', minWidth: 90, align: 'right' },
  { id: 'permissoesTexto', header: 'Permissões', accessorKey: 'permissoesTexto', minWidth: 110, align: 'right' },
  { id: 'situacao', header: 'Status', accessorKey: 'situacao', minWidth: 95 }
]
</script>

<template>
  <section aria-label="Perfis de acesso cadastrados">
    <UiDataTable
      ref="tabelaRef"
      title="Perfis de Acesso"
      subtitle="Base de demonstração — fase 1 em memória · Permissões: ações concedidas de 99 (11 módulos × 9 ações)"
      :data="linhas"
      :columns="colunas"
      :default-page-size="5"
      show-header-top
      show-filters
      :filters-count="filtrosAtivosCount"
      @open-filters="emit('open-filters')"
    >
      <template #cell(usuarios)="{ value }">
        <span class="font-mono tabular-nums">{{ value }}</span>
      </template>

      <template #cell(permissoesTexto)="{ value }">
        <span class="font-mono tabular-nums">{{ value }}</span>
      </template>

      <template #cell(situacao)="{ value }">
        <UiBadge :variant="VARIANTE_POR_STATUS[value]" size="sm">
          {{ value }}
        </UiBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-[7px]">
          <UiTooltip content="Configurar permissões" position="top">
            <button
              type="button"
              aria-label="Configurar permissões do perfil"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('permissoes', row)"
            >
              <KeyRound class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>

          <UiTooltip content="Editar perfil" position="top">
            <button
              type="button"
              aria-label="Editar perfil"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:text-brand-focus hover:bg-lime-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('editar', row)"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>

          <UiTooltip content="Excluir perfil" position="top">
            <button
              type="button"
              aria-label="Excluir perfil"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
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
