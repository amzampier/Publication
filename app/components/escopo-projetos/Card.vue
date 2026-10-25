<script setup lang="ts">
import { computed } from 'vue'
import {
  Archive,
  Calendar,
  CalendarRange,
  ClipboardList,
  Eye,
  ListChecks,
  Pencil,
  Send,
  Trash2
} from '@lucide/vue'
import type { ActionMenuItem } from '../ui/ActionMenu.vue'
import { usePermissions } from '../../composables/usePermissions'
import {
  VARIANTE_POR_STATUS,
  formatarNumero,
  formatarPeriodo,
  motivoBloqueioExclusao,
  type ProjetoEscopoModelo
} from './useEscopoProjetosModelo'

const props = defineProps<{ escopo: ProjetoEscopoModelo }>()

const emit = defineEmits<{
  (e: 'ver-itens', escopo: ProjetoEscopoModelo): void
  (e: 'editar', escopo: ProjetoEscopoModelo): void
  (e: 'excluir', escopo: ProjetoEscopoModelo): void
  (e: 'publicar', escopo: ProjetoEscopoModelo): void
  (e: 'arquivar', escopo: ProjetoEscopoModelo): void
}>()

const { can } = usePermissions()

const linhas = computed(() => [
  { rotulo: 'Ano', valor: String(props.escopo.ano), icone: Calendar },
  {
    rotulo: 'Período',
    valor: formatarPeriodo(props.escopo.dataInicio, props.escopo.dataFinal),
    icone: CalendarRange
  },
  {
    rotulo: 'Itens vinculados',
    valor: formatarNumero(props.escopo.itensCount),
    icone: ListChecks
  },
  {
    rotulo: 'Visualizações',
    valor: formatarNumero(props.escopo.totalVisualizacoes),
    icone: Eye
  }
])

const motivoExclusao = computed(() => motivoBloqueioExclusao(props.escopo))

const acoesDaLinha = (): ActionMenuItem[] => {
  const itens: ActionMenuItem[] = []
  if (can('escopo-projetos', 'publicar')) {
    const publicado = props.escopo.status === 'Publicado'
    itens.push({
      id: 'publicar',
      label: 'Publicar',
      icon: Send,
      hoverText: '#047857',
      disabled: publicado,
      reason: publicado ? 'Escopo já publicado.' : undefined
    })
  }
  if (can('escopo-projetos', 'arquivar')) {
    itens.push({
      id: 'arquivar',
      label: 'Arquivar',
      icon: Archive,
      hoverText: '#0364f7'
    })
  }
  return itens
}

const acionarMenu = (id: string) => {
  if (id === 'publicar') emit('publicar', props.escopo)
  if (id === 'arquivar') emit('arquivar', props.escopo)
}
</script>

<template>
  <UiEntityCard
    :codigo="escopo.codigo"
    :badge="{ label: escopo.status, variant: VARIANTE_POR_STATUS[escopo.status] }"
    :icone="ClipboardList"
    :titulo="escopo.nome"
    :subtitulo="escopo.versao"
    :linhas="linhas"
  >
    <template #acoes>
      <UiTooltip
        v-if="can('escopo-projetos', 'visualizar')"
        :content="`Chamadas do projeto (${escopo.itensCount})`"
        position="top"
      >
        <button
          type="button"
          :aria-label="`Ver itens de ${escopo.nome}`"
          class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 transition-colors hover:bg-sky-50 hover:text-brand-structure focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
          @click="emit('ver-itens', escopo)"
        >
          <ListChecks class="h-3.5 w-3.5" />
        </button>
      </UiTooltip>

      <UiTooltip v-if="can('escopo-projetos', 'alterar')" content="Editar escopo" position="top">
        <button
          type="button"
          :aria-label="`Editar ${escopo.nome}`"
          class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 transition-colors hover:bg-lime-50 hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
          @click="emit('editar', escopo)"
        >
          <Pencil class="h-3.5 w-3.5" />
        </button>
      </UiTooltip>

      <UiTooltip
        v-if="can('escopo-projetos', 'excluir')"
        :content="motivoExclusao ?? 'Excluir escopo'"
        position="top"
      >
        <button
          type="button"
          :disabled="motivoExclusao !== null"
          :aria-label="
            motivoExclusao ? `Excluir escopo — ${motivoExclusao}` : `Excluir ${escopo.nome}`
          "
          :title="motivoExclusao ?? 'Excluir escopo'"
          class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
          @click="emit('excluir', escopo)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </UiTooltip>

      <UiActionMenu
        v-if="acoesDaLinha().length"
        :items="acoesDaLinha()"
        :label="`Mais ações do escopo ${escopo.codigo}`"
        @select="acionarMenu"
      />
    </template>
  </UiEntityCard>
</template>
