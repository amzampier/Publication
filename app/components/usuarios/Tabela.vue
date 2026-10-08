<script setup lang="ts">
import { ref } from 'vue'
import { Import, MailCheck, Lock, Pencil, Trash2 } from '@lucide/vue'
import { type ColumnDef } from '../../utils/dataGrid'
import {
  useUsuariosDemo,
  formatarUltimoAcesso,
  VARIANTE_POR_PERFIL,
  VARIANTE_POR_STATUS,
  type UsuarioDemo
} from './useUsuariosDemo'
import { useToast } from '../../composables/useToast'

const { toast } = useToast()
const { usuariosFiltrados, filtrosAtivosCount } = useUsuariosDemo()

// Abre modais na página (coordenação dela): filtros, edição, exclusão, importação e convite
const emit = defineEmits<{
  (e: 'filtros'): void
  (e: 'editar', usuario: UsuarioDemo): void
  (e: 'excluir', usuario: UsuarioDemo): void
  (e: 'importar'): void
  (e: 'convite', usuario: UsuarioDemo): void
}>()

// Encadeia o foco da busca do kit (usado quando a linha do gatilho sai do DOM)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)
defineExpose({ focarBusca: () => tabelaRef.value?.focarBusca() })

// Só a ação de bloqueio segue o contrato de transição da fase 1: toast, sem modal
const avisoProximaEtapa = (acao: string) => {
  toast.info('Gestão de Usuários', `${acao}: funcionalidade disponível na próxima etapa.`)
}

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
      subtitle="Base de demonstração — fase 1 em memória"
      :data="usuariosFiltrados"
      :columns="colunas"
      :default-page-size="5"
      show-header-top
      show-filters
      :filters-count="filtrosAtivosCount"
      @open-filters="emit('filtros')"
    >
      <template #filtersLeft>
        <UiTooltip content="Importar Novos Usuários" position="top">
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
        <UiBadge :variant="VARIANTE_POR_PERFIL[value]" size="sm">
          {{ value }}
        </UiBadge>
      </template>

      <template #cell(status)="{ value }">
        <UiBadge :variant="VARIANTE_POR_STATUS[value]" size="sm">
          {{ value }}
        </UiBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-[7px]">
          <UiTooltip content="Enviar o Convite" position="top">
            <button
              type="button"
              aria-label="Enviar o Convite"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('convite', row)"
            >
              <MailCheck class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>
          <UiTooltip content="Bloquear usuário" position="top">
            <button
              type="button"
              aria-label="Bloquear usuário"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="avisoProximaEtapa('Bloquear usuário')"
            >
              <Lock class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>
          <UiTooltip content="Editar usuário" position="top">
            <button
              type="button"
              aria-label="Editar usuário"
              class="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:text-brand-focus hover:bg-lime-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="emit('editar', row)"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
          </UiTooltip>
          <UiTooltip content="Excluir usuário" position="top">
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
