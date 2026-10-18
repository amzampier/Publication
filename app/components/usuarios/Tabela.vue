<script setup lang="ts">
import { ref } from 'vue'
import { Import, MailCheck, Lock, Pencil, Trash2 } from '@lucide/vue'
import { type ColumnDef } from '../../utils/dataGrid'
import { usePermissions } from '../../composables/usePermissions'
import { useUsuarios } from './useUsuarios'
import {
  formatarUltimoAcesso,
  variantePerfil,
  VARIANTE_POR_STATUS,
  type UsuarioModelo
} from './useUsuariosModelo'

const { usuariosFiltrados, filtrosAtivosCount, pagina, porPagina, total, irParaPagina, mudarPorPagina, buscar, ordenarPor, busca } =
  useUsuarios()

const { can } = usePermissions()

// Abre modais na página (coordenação dela): filtros, edição, exclusão, importação, convite e bloqueio
const emit = defineEmits<{
  (e: 'filtros'): void
  (e: 'editar', usuario: UsuarioModelo): void
  (e: 'excluir', usuario: UsuarioModelo): void
  (e: 'importar'): void
  (e: 'convite', usuario: UsuarioModelo): void
  (e: 'bloquear', usuario: UsuarioModelo): void
}>()

// Encadeia o foco da busca do kit (usado quando a linha do gatilho sai do DOM)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)
defineExpose({ focarBusca: () => tabelaRef.value?.focarBusca() })

const colunas: ColumnDef[] = [
  { id: 'nome', header: 'Nome', accessorKey: 'nome', minWidth: 170 },
  { id: 'email', header: 'E-mail', accessorKey: 'email', minWidth: 220 },
  { id: 'perfil', header: 'Perfil', accessorKey: 'perfil', minWidth: 110 },
  { id: 'status', header: 'Status', accessorKey: 'status', minWidth: 95 },
  {
    id: 'ultimoAcesso',
    header: 'Último acesso',
    accessorKey: 'ultimoAcesso',
    minWidth: 135,
    format: (v) => formatarUltimoAcesso(v)
  }
]
</script>

<template>
  <section aria-label="Usuários cadastrados">
    <UiDataTable
      ref="tabelaRef"
      title="Usuários"
      subtitle="Usuários cadastrados no sistema"
      :data="usuariosFiltrados"
      :initial-search="busca"
      :columns="colunas"
      :default-page-size="20"
      server-mode
      :total="total"
      :page="pagina"
      :per-page="porPagina"
      show-header-top
      :show-search="can('gestao-usuarios', 'buscar')"
      :show-filters="can('gestao-usuarios', 'filtrar')"
      :filters-count="filtrosAtivosCount"
      @open-filters="emit('filtros')"
      @page-change="irParaPagina"
      @per-page-change="mudarPorPagina"
      @search="buscar"
      @sort-change="ordenarPor"
    >
      <template #filtersLeft>
        <UiTooltip v-if="can('gestao-usuarios', 'importar')" content="Importar Novos Usuários" position="top">
          <button
            type="button"
            aria-label="Importar novos usuários"
            class="inline-flex items-center justify-center rounded p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="emit('importar')"
          >
            <Import class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>

      <template #cell(perfil)="{ value }">
        <UiBadge :variant="variantePerfil(value)" size="sm">
          {{ value }}
        </UiBadge>
      </template>

      <template #cell(status)="{ value }">
        <UiBadge :variant="VARIANTE_POR_STATUS[value as UsuarioModelo['status']]" size="sm">
          {{ value }}
        </UiBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-[7px]">
          <UiTooltip v-if="can('gestao-usuarios', 'convite')" content="Enviar o Convite" position="top">
            <button
              type="button"
              aria-label="Enviar o Convite"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('convite', row)"
            >
              <MailCheck class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>
          <UiTooltip
            v-if="can('gestao-usuarios', 'alterar')"
            :content="row.status === 'Ativo' ? 'Bloquear usuário' : 'Desbloquear usuário'"
            position="top"
          >
            <button
              type="button"
              :aria-label="row.status === 'Ativo' ? 'Bloquear usuário' : 'Desbloquear usuário'"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('bloquear', row)"
            >
              <Lock class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>
          <UiTooltip v-if="can('gestao-usuarios', 'alterar')" content="Editar usuário" position="top">
            <button
              type="button"
              aria-label="Editar usuário"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:text-brand-focus hover:bg-lime-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('editar', row)"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>
          <UiTooltip v-if="can('gestao-usuarios', 'excluir')" content="Excluir usuário" position="top">
            <button
              type="button"
              aria-label="Excluir usuário"
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
