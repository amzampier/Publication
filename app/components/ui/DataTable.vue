<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useId, useSlots } from 'vue'
import {
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  Calculator,
  GripVertical,
  Search,
  FileSpreadsheet,
  Funnel,
  Plus,
  Minus
} from '@lucide/vue'
import {
  type ColumnDef,
  type AggregateOperation,
  type GroupNode,
  type SortRule,
  calculateAggregate,
  formatarValorGrupo,
  groupDataHierarchical,
  sortMultiColumn
} from '../../utils/dataGrid'

interface Props {
  data: any[]
  columns: ColumnDef[]
  title?: string
  subtitle?: string
  initialGroupedColumns?: string[]
  pageSizeOptions?: number[]
  defaultPageSize?: number
  showHeaderTop?: boolean
  /** Exibe o campo de busca no topo (opt-out via `showSearch`; default true). */
  showSearch?: boolean
  /** Exibe o botao 'Filtros' na toolbar (opt-in; emite open-filters) */
  showFilters?: boolean
  /** Quantidade de filtros ativos exibida no badge do botao Filtros */
  filtersCount?: number
  /** Termo de busca inicial (hidrata o campo; nao dispara busca). */
  initialSearch?: string
  /** Modo servidor: renderiza a página recebida e emite eventos (change paginacao-server-side-e-performance) */
  serverMode?: boolean
  /** Total de registros do conjunto (modo servidor) — deriva as páginas */
  total?: number
  /** Página corrente controlada pelo pai (modo servidor) */
  page?: number
  /** Registros por página controlados pelo pai (modo servidor) */
  perPage?: number
  /** Debounce (ms) da busca no modo servidor antes de emitir `search` */
  searchDebounceMs?: number
  searchLabel?: string
  /** Expansão de linha (opt-in): habilita o controle +/- em cada linha. */
  expandable?: boolean
  /** Chaves (rowKey) das linhas expandidas (`v-model:expanded`). */
  expanded?: string[]
  /** Campo identificador da linha usado na expansão (default `id`). */
  rowKey?: string
  /** Rótulo acessível do controle de expansão. */
  expandLabel?: string
  /** Mantém a coluna de Ações fixa à direita durante a rolagem horizontal. */
  stickyActions?: boolean
  error?: boolean | string
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  initialGroupedColumns: () => [],
  pageSizeOptions: () => [5, 10, 20, 50],
  defaultPageSize: 5,
  showHeaderTop: false,
  showSearch: true,
  showFilters: false,
  filtersCount: 0,
  initialSearch: '',
  serverMode: false,
  total: 0,
  page: 1,
  perPage: 0,
  searchDebounceMs: 300,
  searchLabel: 'Buscar na tabela',
  expandable: false,
  expanded: () => [],
  rowKey: 'id',
  expandLabel: 'Expandir itens',
  stickyActions: false,
  error: false,
  errorMessage: ''
})

const emit = defineEmits<{
  (e: 'open-filters'): void
  (e: 'page-change', pagina: number): void
  (e: 'per-page-change', porPagina: number): void
  (e: 'sort-change', regras: SortRule[]): void
  (e: 'search', termo: string): void
  (e: 'update:expanded', chaves: string[]): void
  (e: 'retry'): void
}>()

const slots = useSlots()

// Expansão de linha (opt-in): a coluna líder é renderizada quando a expansão
// está habilitada ou quando o chamador fornece o slot de cabeçalho (a flag que
// liga/desliga os controles). Sem essas props, nada muda no componente.
const mostrarColunaExpansao = computed(() => props.expandable || !!slots.expandHeader)
const chavesExpandidas = computed(() => new Set(props.expanded))
const chaveDaLinha = (row: any): string => String(row?.[props.rowKey] ?? '')
const linhaExpandida = (row: any): boolean => chavesExpandidas.value.has(chaveDaLinha(row))
const alternarLinha = (row: any) => {
  const chave = chaveDaLinha(row)
  const atual = new Set(props.expanded)
  if (atual.has(chave)) atual.delete(chave)
  else atual.add(chave)
  emit('update:expanded', [...atual])
}
const colSpanTotal = computed(
  () => props.columns.length + (slots.actions ? 1 : 0) + (mostrarColunaExpansao.value ? 1 : 0)
)

const classesAcoesCabecalho = computed(() =>
  props.stickyActions
    ? 'sticky right-0 z-30 w-28 min-w-28 max-w-28 border-l border-slate-700 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)]'
    : 'w-20'
)
const classesAcoesCorpo = computed(() =>
  props.stickyActions
    ? 'sticky right-0 z-20 w-28 min-w-28 max-w-28 border-l border-slate-100 bg-white group-hover:bg-slate-50 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)]'
    : ''
)
const classesAcoesRodape = computed(() =>
  props.stickyActions
    ? 'sticky right-0 z-20 w-28 min-w-28 max-w-28 border-l border-slate-300 bg-slate-100 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)]'
    : 'bg-slate-100/90'
)

const serverMode = computed(() => props.serverMode === true)

// Estado de Busca Global
const searchQuery = ref(props.initialSearch ?? '')
// Wrapper do campo de busca - alvo do foco devolvido por focarBusca()
const buscaRef = ref<HTMLElement | null>(null)

// Devolve o foco ao campo de busca (ex.: quando o gatilho que abriu um modal
// saiu do DOM junto com a linha que ele alterava)
const focarBusca = () => {
  buscaRef.value?.querySelector('input')?.focus()
}
defineExpose({ focarBusca })

// Modo servidor: a busca é debounced e emitida (o pai consulta a API).
let buscaTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (q) => {
  if (!serverMode.value) return
  if (buscaTimer) clearTimeout(buscaTimer)
  buscaTimer = setTimeout(() => emit('search', q), props.searchDebounceMs)
})
onUnmounted(() => {
  if (buscaTimer) clearTimeout(buscaTimer)
})

// Estado de Agrupamento (até 3 níveis)
const groupedColumns = ref<string[]>([...props.initialGroupedColumns.slice(0, 3)])
watch(
  () => props.initialGroupedColumns,
  (val) => {
    if (val) {
      groupedColumns.value = [...val.slice(0, 3)]
    }
  },
  { deep: true }
)
const isDraggingOverBox = ref(false)
const draggedColumnId = ref<string | null>(null)

// Estado de Ordenação Multi-Coluna
const sortRules = ref<SortRule[]>([])

// Estado de Paginação
const currentPage = ref(serverMode.value ? (props.page || 1) : 1)
const pageSize = ref(serverMode.value ? (props.perPage || props.defaultPageSize) : props.defaultPageSize)
// id estável (SSR-safe) para associar o rótulo ao seletor "Linhas por página"
const pageSizeId = useId()

// Modo servidor: espelha a página/tamanho controlados pelo pai e emite mudanças.
watch(
  () => props.page,
  (p) => {
    if (serverMode.value && p && p !== currentPage.value) currentPage.value = p
  }
)
watch(
  () => props.perPage,
  (s) => {
    if (serverMode.value && s && s !== pageSize.value) pageSize.value = s
  }
)
watch(currentPage, (p) => {
  if (serverMode.value) emit('page-change', p)
})
watch(pageSize, (s) => {
  if (serverMode.value) emit('per-page-change', s)
})

// Estado de Totalizadores no Rodapé (por coluna)
const footerAggregates = ref<Record<string, AggregateOperation>>({})

// Estado do Menu de Contexto do Rodapé
const contextMenu = ref<{
  visible: boolean
  x: number
  y: number
  columnId: string
}>({
  visible: false,
  x: 0,
  y: 0,
  columnId: ''
})

// Gerenciamento de Nós Expandidos no Agrupamento
const expandedNodes = ref<Record<string, boolean>>({})

const isNodeExpanded = (nodeId: string, level: number = 1) => {
  if (expandedNodes.value[nodeId] !== undefined) {
    return expandedNodes.value[nodeId]
  }
  // Nível 1 expandido por padrão; Níveis 2 e 3 recolhidos por padrão para máxima fidelidade ao mockup
  return level === 1
}

const toggleNode = (nodeId: string, level: number = 1) => {
  expandedNodes.value[nodeId] = !isNodeExpanded(nodeId, level)
}

// ==========================================
// REDIMENSIONAMENTO DE COLUNAS (Column Resizing)
// ==========================================
const columnWidths = ref<Record<string, number>>({})
const resizingColId = ref<string | null>(null)
const startX = ref(0)
const startWidth = ref(0)

const initColumnWidths = () => {
  props.columns.forEach((col) => {
    if (col.width && typeof col.width === 'number') {
      columnWidths.value[col.id] = col.width
    }
  })
}
initColumnWidths()

const startResize = (e: MouseEvent, colId: string) => {
  resizingColId.value = colId
  startX.value = e.clientX

  const th = (e.target as HTMLElement).closest('th')
  startWidth.value = th?.offsetWidth || columnWidths.value[colId] || 150

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!resizingColId.value) return
    const deltaX = moveEvent.clientX - startX.value
    const col = props.columns.find((c) => c.id === resizingColId.value)
    const minW = col?.minWidth || 70
    const newW = Math.max(minW, startWidth.value + deltaX)
    columnWidths.value[resizingColId.value] = newW
  }

  const onMouseUp = () => {
    resizingColId.value = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const getColumnStyle = (col: ColumnDef) => {
  const w = columnWidths.value[col.id]
  if (w) {
    return {
      width: `${w}px`,
      minWidth: `${w}px`,
      maxWidth: `${w}px`
    }
  }
  if (col.width) {
    const val = typeof col.width === 'number' ? `${col.width}px` : col.width
    return {
      width: val,
      minWidth: `${col.minWidth || 80}px`
    }
  }
  return {
    minWidth: `${col.minWidth || 110}px`
  }
}

// ==========================================
// AGRUPAMENTO
// ==========================================
// Todas as colunas que ainda não foram adicionadas ao agrupamento ficam disponíveis
const availableGroupColumns = computed(() => {
  return props.columns.filter(
    (col) => !groupedColumns.value.includes(col.id)
  )
})

const getColumnHeader = (colId: string) => {
  return props.columns.find((c) => c.id === colId)?.header || colId
}

const getGroupValueLabel = (node: { groupKey: string; groupValue: any }) => {
  const col = props.columns.find((c) => c.id === node.groupKey)
  return formatarValorGrupo(node.groupValue, col?.format)
}

const searchLabel = computed(() => props.searchLabel || 'Buscar na tabela')

const getGroupLevelBadge = (colId: string) => {
  const idx = groupedColumns.value.indexOf(colId)
  if (idx === -1) return null
  return `${idx + 1}º Nível`
}

const addGroupColumn = (colId: string) => {
  if (groupedColumns.value.length < 3 && !groupedColumns.value.includes(colId)) {
    groupedColumns.value.push(colId)
    currentPage.value = 1
  }
}

const removeGroupColumn = (colId: string) => {
  groupedColumns.value = groupedColumns.value.filter((id) => id !== colId)
  currentPage.value = 1
}

const clearAllGroups = () => {
  groupedColumns.value = []
  currentPage.value = 1
}

const onAddSublevelChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  if (target.value) {
    addGroupColumn(target.value)
    target.value = ''
  }
}

// Drag & Drop Nativo HTML5 nos Cabeçalhos — qualquer coluna pode ser arrastada
const onDragStart = (e: DragEvent, colId: string) => {
  draggedColumnId.value = colId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copyMove'
    e.dataTransfer.setData('text/plain', colId)
  }
}

const onDragEnd = () => {
  draggedColumnId.value = null
  isDraggingOverBox.value = false
}

const onDragOverBox = (e: DragEvent) => {
  e.preventDefault()
  if (draggedColumnId.value && groupedColumns.value.length < 3 && !groupedColumns.value.includes(draggedColumnId.value)) {
    isDraggingOverBox.value = true
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }
}

const onDragLeaveBox = () => {
  isDraggingOverBox.value = false
}

const onDropBox = (e: DragEvent) => {
  e.preventDefault()
  isDraggingOverBox.value = false
  const colId = draggedColumnId.value || e.dataTransfer?.getData('text/plain')
  if (colId) {
    addGroupColumn(colId)
  }
  draggedColumnId.value = null
}

// ==========================================
// FILTRO E ORDENAÇÃO MULTI-COLUNA
// ==========================================
const filteredData = computed(() => {
  // Modo servidor: as linhas já vêm filtradas/paginadas pelo servidor.
  if (serverMode.value) return props.data
  if (!searchQuery.value.trim()) return props.data

  const q = searchQuery.value.toLowerCase().trim()
  return props.data.filter((item) => {
    return Object.values(item).some((val) => {
      if (val === null || val === undefined) return false
      return String(val).toLowerCase().includes(q)
    })
  })
})

const aplicarSort = (col: ColumnDef, isMulti: boolean) => {
  if (col.sortable === false || !col.header) return

  const existingIdx = sortRules.value.findIndex((r) => r.columnId === col.id)

  if (isMulti) {
    if (existingIdx === -1) {
      sortRules.value.push({ columnId: col.id, direction: 'asc' })
    } else {
      const current = sortRules.value[existingIdx]
      if (current && current.direction === 'asc') {
        current.direction = 'desc'
      } else {
        sortRules.value.splice(existingIdx, 1)
      }
    }
  } else {
    if (existingIdx !== -1 && sortRules.value.length === 1) {
      const current = sortRules.value[0]
      if (current && current.direction === 'asc') {
        sortRules.value = [{ columnId: col.id, direction: 'desc' }]
      } else {
        sortRules.value = []
      }
    } else {
      sortRules.value = [{ columnId: col.id, direction: 'asc' }]
    }
  }

  // Modo servidor: a ordenação é aplicada pela API.
  if (serverMode.value) emit('sort-change', [...sortRules.value])
}

const toggleSort = (col: ColumnDef, event: MouseEvent) => {
  aplicarSort(col, event.shiftKey)
}

/** Ordenação por teclado (Enter/Espaço) — spec data-table: a11y da ordenação. */
const onSortKeydown = (col: ColumnDef, event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  aplicarSort(col, event.shiftKey)
}

const ariaSortFor = (colId: string): 'ascending' | 'descending' | 'none' => {
  const info = getSortInfo(colId)
  if (!info) return 'none'
  return info.direction === 'asc' ? 'ascending' : 'descending'
}

const getSortInfo = (colId: string) => {
  const idx = sortRules.value.findIndex((r) => r.columnId === colId)
  if (idx === -1 || !sortRules.value[idx]) return null
  return {
    index: idx + 1,
    direction: sortRules.value[idx]!.direction,
    isMultiple: sortRules.value.length > 1
  }
}

const sortedData = computed(() => {
  // Modo servidor: a ordenação é responsabilidade do servidor.
  if (serverMode.value) return props.data
  return sortMultiColumn(filteredData.value, sortRules.value, props.columns)
})

// Dados Agrupados em Árvore Hierárquica
const hierarchicalGroups = computed<GroupNode[]>(() => {
  if (groupedColumns.value.length === 0) return []
  return groupDataHierarchical(sortedData.value, groupedColumns.value)
})

interface FlatRow {
  id: string
  type: 'group1' | 'group2' | 'group3' | 'leaf'
  node?: GroupNode
  item?: any
  level?: number
  parentName?: string
}

// Achatamento das linhas visíveis da árvore conforme estado de expansão
const visibleFlatRows = computed<FlatRow[]>(() => {
  if (groupedColumns.value.length === 0) return []
  const rows: FlatRow[] = []

  hierarchicalGroups.value.forEach((node1) => {
    rows.push({
      id: node1.id,
      type: 'group1',
      node: node1,
      level: 1
    })

    if (isNodeExpanded(node1.id, 1)) {
      if (node1.children && node1.children.length > 0) {
        node1.children.forEach((node2) => {
          rows.push({
            id: node2.id,
            type: 'group2',
            node: node2,
            level: 2,
            parentName: String(node1.groupValue)
          })

          if (isNodeExpanded(node2.id, 2)) {
            if (node2.children && node2.children.length > 0) {
              node2.children.forEach((node3) => {
                rows.push({
                  id: node3.id,
                  type: 'group3',
                  node: node3,
                  level: 3
                })

                if (isNodeExpanded(node3.id, 3)) {
                  node3.items.forEach((item, idx) => {
                    rows.push({
                      id: `${node3.id}_item_${idx}`,
                      type: 'leaf',
                      item,
                      level: 3
                    })
                  })
                }
              })
            } else {
              node2.items.forEach((item, idx) => {
                rows.push({
                  id: `${node2.id}_item_${idx}`,
                  type: 'leaf',
                  item,
                  level: 2
                })
              })
            }
          }
        })
      } else {
        node1.items.forEach((item, idx) => {
          rows.push({
            id: `${node1.id}_item_${idx}`,
            type: 'leaf',
            item,
            level: 1
          })
        })
      }
    }
  })

  return rows
})

// Paginação sobre dados agrupados ou planos
// Em modo agrupado, a população paginada é visibleFlatRows (linhas efetivamente
// renderizadas: cabeçalhos de grupo + itens expandidos); no modo plano, sortedData.
const totalEntries = computed(() =>
  serverMode.value
    ? props.total
    : groupedColumns.value.length > 0
      ? visibleFlatRows.value.length
      : sortedData.value.length
)

const paginatedFlatRows = computed<FlatRow[]>(() => {
  if (groupedColumns.value.length === 0) return []
  // No modo servidor a paginação já foi aplicada aos dados recebidos; agrupar
  // apenas acrescenta os cabeçalhos de grupo sobre a página corrente.
  if (serverMode.value) return visibleFlatRows.value
  const start = (currentPage.value - 1) * pageSize.value
  return visibleFlatRows.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  return Math.ceil(totalEntries.value / pageSize.value) || 1
})

const paginatedData = computed(() => {
  // Modo servidor: as linhas recebidas já são a página corrente.
  if (serverMode.value) return props.data
  if (groupedColumns.value.length > 0) {
    return []
  }
  const start = (currentPage.value - 1) * pageSize.value
  return sortedData.value.slice(start, start + pageSize.value)
})

const rangeStart = computed(() => {
  if (totalEntries.value === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const rangeEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, totalEntries.value)
})

// Mantém a página atual dentro dos limites quando o total muda
// (ex.: colapso de grupos reduz as linhas visíveis)
watch(totalEntries, (total) => {
  const maxPage = Math.ceil(total / pageSize.value) || 1
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
  }
})

const getGroupBorderClass = (row: FlatRow) => {
  if (row.type === 'group1') {
    const isExp = isNodeExpanded(row.node!.id, 1)
    if (!isExp) return 'border-l-4 border-l-brand-accent'
    return 'border-l-4 border-l-sky-500'
  }
  if (row.type === 'group2') {
    return 'border-l-4 border-l-sky-500'
  }
  return 'border-l-4 border-l-slate-200'
}

// Totalizadores
const getFooterValue = (col: ColumnDef) => {
  const op = footerAggregates.value[col.id]
  if (!op || op === 'NONE') return ''
  return calculateAggregate(filteredData.value, col.accessorKey, op)
}

const openFooterContextMenu = (e: MouseEvent, colId: string) => {
  e.preventDefault()
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY - 140,
    columnId: colId
  }
}

const selectAggregate = (operation: AggregateOperation) => {
  if (contextMenu.value.columnId) {
    footerAggregates.value[contextMenu.value.columnId] = operation
  }
  contextMenu.value.visible = false
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

onMounted(() => {
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
})
</script>

<template>
  <div class="w-full bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden select-none">
    <!-- Top Bar Conforme Mockup: Título (se fornecido) + Campo de Busca (se habilitado) -->
    <div
      v-if="(title || subtitle) || showHeaderTop || showFilters"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border-b border-slate-200"
    >
      <div v-if="title || subtitle" class="flex items-start gap-3">
        <div class="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/30 text-brand-focus shrink-0 mt-0.5">
          <FileSpreadsheet class="h-5 w-5" />
        </div>
        <div>
          <h3
            v-if="title"
            class="text-sm sm:text-base font-bold text-slate-900 tracking-tight"
          >
            {{ title }}
          </h3>
          <p v-if="subtitle" class="text-xs text-slate-600 mt-0.5">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- Busca no padrao do kit (UiInput) + botao Filtros opt-in -->
      <div
        v-if="showHeaderTop || showFilters"
        class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end"
      >
        <div v-if="showHeaderTop && showSearch" ref="buscaRef" class="w-full min-w-0 sm:w-64 shrink-0">
          <UiInput
            v-model="searchQuery"
            :aria-label="searchLabel"
            placeholder="Filtrar dados da tabela..."
            :left-icon="Search"
            :right-icon="searchQuery ? X : undefined"
            :right-icon-label="'Limpar busca'"
            @right-icon-click="searchQuery = ''"
          />
        </div>

        <!-- Slot opt-in imediatamente à esquerda do botão Filtros (ex.: botão Importar) -->
        <slot name="filtersLeft" />

        <UiButton
          v-if="showFilters"
          variant="outline"
          size="sm"
          class="shrink-0"
          @click="emit('open-filters')"
        >
          <template #leftIcon><Funnel class="h-3.5 w-3.5" /></template>
          Filtros
          <UiBadge v-if="filtersCount > 0" variant="done" size="sm" class="ml-1.5">
            {{ filtersCount }}
          </UiBadge>
        </UiButton>
      </div>
    </div>

    <!-- Faixa de Agrupamento -->
    <div
      :class="[
        'px-4 py-2.5 min-h-[42px] bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2.5 text-xs transition-colors',
        isDraggingOverBox ? 'bg-brand-accent/10 border-brand-accent ring-2 ring-brand-accent/30' : ''
      ]"
      @dragover="onDragOverBox"
      @dragleave="onDragLeaveBox"
      @drop="onDropBox"
    >
      <!-- Label -->
      <div class="flex items-center gap-1.5 font-semibold text-slate-700 text-xs shrink-0">
        <Layers class="h-4 w-4 text-brand-focus" />
        <span>Agrupamento:</span>
      </div>

      <!-- Chips de Colunas Agrupadas -->
      <div
        v-for="(colId, idx) in groupedColumns"
        :key="colId"
        class="inline-flex items-center gap-1.5 bg-brand-primary text-white text-[11px] font-medium px-2.5 py-0.5 rounded shadow-xs select-none"
      >
        <span class="bg-brand-accent text-slate-950 font-bold font-mono text-[8.5px] px-1 py-0.2 rounded-xs leading-none tracking-tight">
          {{ idx + 1 }}º NÍVEL
        </span>
        <span>{{ getColumnHeader(colId) }}</span>
        <button
          type="button"
          class="text-slate-500 hover:text-white ml-0.5 p-0.5 transition-colors cursor-pointer"
          title="Remover agrupamento"
          :aria-label="`Remover agrupamento de ${getColumnHeader(colId)}`"
          @click="removeGroupColumn(colId)"
        >
          <X class="h-3 w-3" />
        </button>
      </div>

      <!-- Placeholder quando vazio -->
      <span v-if="groupedColumns.length === 0" class="text-[11px] text-slate-500 italic">
        Nenhuma coluna agrupada
      </span>

      <!-- Dica: arraste qualquer cabeçalho de coluna para cá -->
      <span
        v-if="groupedColumns.length < 3"
        class="ml-auto text-[11px] text-slate-500 italic hidden sm:inline"
      >
        Arraste um cabeçalho de coluna para agrupar
      </span>
    </div>

    <!-- Tabela Principal com Rolagem Horizontal, Divisórias cxGrid e Column Resizing -->
    <div class="overflow-x-auto relative min-h-[240px]">
      <table class="w-full text-left text-xs border-collapse">
        <!-- Cabeçalho Corporativo (brand.primary `#112051`) com Suporte a Drag & Drop, Multi-Sort e Redimensionamento -->
        <thead>
          <tr class="bg-brand-primary text-white font-semibold divide-x divide-slate-700 border-b border-slate-800">
            <th
              v-if="mostrarColunaExpansao"
              scope="col"
              class="w-9 px-1 py-1.5 text-center text-[11px] bg-brand-primary"
            >
              <slot name="expandHeader" />
            </th>
            <th
              v-for="col in columns"
              :key="col.id"
              draggable="true"
              :style="getColumnStyle(col)"
              :tabindex="(col.sortable === false || !col.header) ? undefined : 0"
              :aria-sort="(col.sortable === false || !col.header) ? undefined : ariaSortFor(col.id)"
              :aria-label="(col.sortable === false || !col.header) ? undefined : `Ordenar por ${col.header}`"
              :class="[
                'py-1.5 px-2.5 tracking-tight select-none transition-colors group relative cursor-pointer hover:bg-white/10',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
              ]"
              @dragstart="onDragStart($event, col.id)"
              @dragend="onDragEnd"
              @click="toggleSort(col, $event)"
              @keydown="onSortKeydown(col, $event)"
            >
              <div

                class="inline-flex items-center gap-1 w-full"
                :class="col.align === 'right' ? 'justify-end' : 'justify-between'"
              >
                <div class="inline-flex items-center gap-1.5 truncate">
                  <!-- Indicador de Arraste (Grip) -->
                  <GripVertical
                    v-if="col.groupable"
                    class="h-3 w-3 text-white/60 opacity-60 group-hover:opacity-100 shrink-0"
                  />

                  <span class="truncate font-bold text-[11px]">{{ col.header }}</span>

                  <!-- Badge de Nível de Agrupamento Conforme Mockup (ex: "1º Nível", "2º Nível") -->
                  <span
                    v-if="getGroupLevelBadge(col.id)"
                    class="bg-brand-accent text-slate-950 font-bold font-mono text-[8.5px] px-1 py-0.2 rounded-xs shadow-2xs shrink-0 leading-none"
                  >
                    {{ getGroupLevelBadge(col.id) }}
                  </span>
                </div>

                <!-- Indicador de Ordenação (Seta ↑↓) -->
                <div class="inline-flex items-center gap-0.5 ml-1 shrink-0">
                  <template v-if="getSortInfo(col.id)">
                    <ArrowUp
                      v-if="getSortInfo(col.id)!.direction === 'asc'"
                      class="h-3 w-3 text-brand-accent stroke-[2.5]"
                    />
                    <ArrowDown
                      v-else
                      class="h-3 w-3 text-brand-accent stroke-[2.5]"
                    />
                    <!-- Número de Prioridade da Ordenação Multi-Coluna -->
                    <span
                      v-if="getSortInfo(col.id)!.isMultiple"
                      class="px-1 rounded bg-brand-accent text-slate-950 font-mono text-[8.5px] font-bold"
                    >
                      {{ getSortInfo(col.id)!.index }}
                    </span>
                  </template>
                  <ArrowUpDown
                    v-else
                    class="h-3 w-3 text-white/85 stroke-[2.5] group-hover:text-brand-accent transition-colors"
                  />
                </div>
              </div>

              <!-- HANDLE DE REDIMENSIONAMENTO DE COLUNA (Arraste para Esquerda/Direita) -->
              <div
                class="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize select-none hover:bg-brand-accent/90 z-20 transition-colors"
                :class="{ 'bg-brand-accent opacity-100': resizingColId === col.id }"
                @mousedown.prevent.stop="startResize($event, col.id)"
                @click.stop
              />
            </th>
            <th
              v-if="$slots.actions"
              class="py-1.5 px-2 text-center bg-brand-primary text-[11px]"
              :class="classesAcoesCabecalho"
            >
              Ações
            </th>
          </tr>
        </thead>

        <!-- Corpo: Renderização Idêntica ao Mockup (Árvore Hierárquica com Barra Azul/Verde Lateral e Botões Quadrados) -->
        <tbody class="divide-y divide-slate-200 bg-white">
          <!-- CASO 1: Renderização com Subagrupamento Hierárquico Baseada em Linhas Visíveis Achatadas -->
          <template v-if="groupedColumns.length > 0">
            <template v-for="row in paginatedFlatRows" :key="row.id">
              <!-- Linha Nível 1 -->
              <tr
                v-if="row.type === 'group1'"
                :class="[
                  'font-medium text-slate-900 cursor-pointer transition-colors border-y border-slate-200 h-8',
                  getGroupBorderClass(row),
                  isNodeExpanded(row.node!.id, 1) ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white hover:bg-slate-50'
                ]"
                @click="toggleNode(row.node!.id, 1)"
                tabindex="0"
                :aria-expanded="isNodeExpanded(row.node!.id, 1)"
                @keydown.enter.prevent="toggleNode(row.node!.id, 1)"
                @keydown.space.prevent="toggleNode(row.node!.id, 1)"
              >
                <td :colspan="colSpanTotal" class="py-1 px-2.5">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="h-5 w-5 rounded border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-2xs shrink-0 transition-colors">
                        <ChevronDown v-if="isNodeExpanded(row.node!.id, 1)" class="h-3 w-3 text-slate-600" />
                        <ChevronRight v-else class="h-3 w-3 text-slate-600" />
                      </div>

                      <span class="bg-lime-50 border border-lime-300 text-lime-800 font-bold font-mono text-[8.5px] px-1.5 py-0.5 rounded leading-none shadow-2xs">
                        1º NÍVEL
                      </span>

                      <span class="text-slate-600 font-normal text-[11px]">{{ getColumnHeader(row.node!.groupKey) }}:</span>
                      <span class="text-slate-900 font-bold text-[11px]">{{ getGroupValueLabel(row.node!) }}</span>

                      <span class="text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-normal font-sans shadow-2xs">
                        {{ row.node!.count }} {{ row.node!.count === 1 ? 'registro' : 'registros' }}<span v-if="serverMode" class="font-normal text-slate-500"> (nesta página)</span>
                      </span>
                    </div>

                    <span class="text-[10px] text-slate-500 font-normal hidden sm:inline pr-2">
                      Clique para {{ isNodeExpanded(row.node!.id, 1) ? 'recolher' : 'expandir' }}
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Linha Nível 2 -->
              <tr
                v-else-if="row.type === 'group2'"
                :class="[
                  'font-medium text-slate-800 cursor-pointer transition-colors border-y border-slate-100 h-8',
                  getGroupBorderClass(row),
                  isNodeExpanded(row.node!.id, 2) ? 'bg-slate-50/60 hover:bg-slate-100/60' : 'bg-white hover:bg-slate-50/80'
                ]"
                @click="toggleNode(row.node!.id, 2)"
                tabindex="0"
                :aria-expanded="isNodeExpanded(row.node!.id, 2)"
                @keydown.enter.prevent="toggleNode(row.node!.id, 2)"
                @keydown.space.prevent="toggleNode(row.node!.id, 2)"
              >
                <td :colspan="colSpanTotal" class="py-1 px-2.5 pl-8">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="h-4.5 w-4.5 rounded border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-2xs shrink-0">
                        <ChevronDown v-if="isNodeExpanded(row.node!.id, 2)" class="h-2.5 w-2.5 text-slate-600" />
                        <ChevronRight v-else class="h-2.5 w-2.5 text-slate-600" />
                      </div>

                      <span class="bg-sky-50 border border-sky-300 text-sky-800 font-bold font-mono text-[8.5px] px-1.5 py-0.5 rounded leading-none shadow-2xs">
                        2º NÍVEL
                      </span>

                      <span class="text-slate-600 font-normal text-[11px]">{{ getColumnHeader(row.node!.groupKey) }}:</span>
                      <span class="text-slate-900 font-bold text-[11px]">{{ getGroupValueLabel(row.node!) }}</span>

                      <span class="text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-normal font-sans shadow-2xs">
                        {{ row.node!.count }} {{ row.node!.count === 1 ? 'registro' : 'registros' }}<span v-if="serverMode" class="font-normal text-slate-500"> (nesta página)</span>
                      </span>
                    </div>

                    <span class="text-[10px] text-slate-500 font-normal hidden sm:inline pr-2">
                      Clique para {{ isNodeExpanded(row.node!.id, 2) ? 'recolher' : 'expandir' }}
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Linha Nível 3 -->
              <tr
                v-else-if="row.type === 'group3'"
                class="bg-slate-50/40 font-medium text-slate-700 cursor-pointer hover:bg-slate-100/50 transition-colors border-y border-slate-100 h-8"
                @click="toggleNode(row.node!.id, 3)"
                tabindex="0"
                :aria-expanded="isNodeExpanded(row.node!.id, 3)"
                @keydown.enter.prevent="toggleNode(row.node!.id, 3)"
                @keydown.space.prevent="toggleNode(row.node!.id, 3)"
              >
                <td :colspan="colSpanTotal" class="py-1 px-2.5 pl-14">
                  <div class="flex items-center gap-2">
                    <div class="h-4.5 w-4.5 rounded border border-slate-300 bg-white flex items-center justify-center text-slate-600 shadow-2xs shrink-0">
                      <ChevronDown v-if="isNodeExpanded(row.node!.id, 3)" class="h-2.5 w-2.5 text-slate-600" />
                      <ChevronRight v-else class="h-2.5 w-2.5 text-slate-600" />
                    </div>
                    <span class="bg-indigo-50 border border-indigo-300 text-indigo-800 font-bold font-mono text-[8.5px] px-1.5 py-0.5 rounded leading-none shadow-2xs">
                      3º NÍVEL
                    </span>
                    <span class="text-slate-600 font-normal text-[11px]">{{ getColumnHeader(row.node!.groupKey) }}:</span>
                    <span class="text-slate-900 font-bold text-[11px]">{{ getGroupValueLabel(row.node!) }}</span>
                    <span class="text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-normal font-sans">
                      {{ row.node!.count }} {{ row.node!.count === 1 ? 'registro' : 'registros' }}<span v-if="serverMode" class="font-normal text-slate-500"> (nesta página)</span>
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Linha Folha de Dados (Leaf Row) -->
              <tr
                v-else-if="row.type === 'leaf'"
                class="group hover:bg-slate-50/90 transition-colors divide-x divide-slate-100"
              >
                <td v-if="mostrarColunaExpansao" class="py-1 px-1.5 text-center">
                  <button
                    v-if="expandable"
                    type="button"
                    class="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
                    :aria-expanded="linhaExpandida(row.item)"
                    :aria-label="expandLabel"
                    @click.stop="alternarLinha(row.item)"
                  >
                    <Minus v-if="linhaExpandida(row.item)" class="h-3 w-3" aria-hidden="true" />
                    <Plus v-else class="h-3 w-3" aria-hidden="true" />
                  </button>
                </td>
                <td
                  v-for="(col, cIdx) in columns"
                  :key="col.id"
                  :style="getColumnStyle(col)"
                  :class="[
                    'py-1 px-2.5 text-[11px] text-slate-800 truncate',
                    cIdx === 0 ? (row.level === 3 ? 'pl-20' : row.level === 2 ? 'pl-14' : 'pl-10') : '',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.isNumeric || col.align === 'right' ? 'tabular-nums' : '',
                    /data|codigo|chamada|semana|ano|mes|Em$/i.test(col.id) ? 'tabular-nums' : '',
                    /codigo|chamada/i.test(col.id) ? 'font-mono' : ''
                  ]"
                >
                  <slot :name="`cell(${col.id})`" :row="row.item" :value="row.item[col.accessorKey]">
                    {{ col.format ? col.format(row.item[col.accessorKey], row.item) : row.item[col.accessorKey] }}
                  </slot>
                </td>
                <td v-if="$slots.actions" class="py-1 px-2 text-center" :class="classesAcoesCorpo">
                  <slot name="actions" :row="row.item" />
                </td>
              </tr>

              <tr
                v-if="row.type === 'leaf' && expandable && linhaExpandida(row.item)"
                class="bg-slate-50/70"
              >
                <td :colspan="colSpanTotal" class="border-t border-slate-200 px-3 py-3">
                  <slot name="expanded" :row="row.item" />
                </td>
              </tr>

            </template>
            <tr v-if="paginatedFlatRows.length === 0">
              <td :colspan="colSpanTotal" class="py-10 text-center">
                <div v-if="error" class="mx-auto flex max-w-md flex-col items-center gap-2 px-4">
                  <AlertCircle class="h-6 w-6 text-rose-700" aria-hidden="true" />
                  <p class="text-xs font-medium text-rose-700" role="alert">
                    {{ typeof error === 'string' ? error : (errorMessage || 'Não foi possível carregar os dados.') }}
                  </p>
                  <button
                    type="button"
                    class="mt-1 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-brand-focus hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
                    @click="emit('retry')"
                  >
                    <RotateCw class="h-3.5 w-3.5" aria-hidden="true" />
                    Tentar novamente
                  </button>
                </div>
                <span v-else class="text-slate-600">
                  {{ (filtersCount > 0 || searchQuery.trim() !== '') ? 'Nenhum resultado encontrado para o filtro.' : 'Nenhum registro encontrado.' }}
                </span>
              </td>
            </tr>
          </template>

          <!-- CASO 2: Renderização Plana (Sem agrupamento) com Divisórias Verticais cxGrid -->
          <template v-else>
            <template v-for="(row, idx) in paginatedData" :key="chaveDaLinha(row) || idx">
              <tr class="group hover:bg-slate-50/90 transition-colors divide-x divide-slate-100">
                <td v-if="mostrarColunaExpansao" class="py-1.5 px-1.5 text-center">
                  <button
                    v-if="expandable"
                    type="button"
                    class="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
                    :aria-expanded="linhaExpandida(row)"
                    :aria-label="expandLabel"
                    @click.stop="alternarLinha(row)"
                  >
                    <Minus v-if="linhaExpandida(row)" class="h-3 w-3" aria-hidden="true" />
                    <Plus v-else class="h-3 w-3" aria-hidden="true" />
                  </button>
                </td>
                <td
                  v-for="col in columns"
                  :key="col.id"
                  :style="getColumnStyle(col)"
                  :class="[
                    'py-1.5 px-2.5 text-[11px] text-slate-800 truncate',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.isNumeric || col.align === 'right' ? 'tabular-nums' : '',
                    /data|codigo|chamada|semana|ano|mes|Em$/i.test(col.id) ? 'tabular-nums' : '',
                    /codigo|chamada/i.test(col.id) ? 'font-mono' : ''
                  ]"
                >
                  <slot :name="`cell(${col.id})`" :row="row" :value="row[col.accessorKey]">
                    {{ col.format ? col.format(row[col.accessorKey], row) : row[col.accessorKey] }}
                  </slot>
                </td>
                <td v-if="$slots.actions" class="py-1.5 px-2 text-center" :class="classesAcoesCorpo">
                  <slot name="actions" :row="row" />
                </td>
              </tr>

              <tr v-if="expandable && linhaExpandida(row)" class="bg-slate-50/70">
                <td :colspan="colSpanTotal" class="border-t border-slate-200 px-3 py-3">
                  <slot name="expanded" :row="row" />
                </td>
              </tr>
            </template>

            <tr v-if="paginatedData.length === 0">
              <td :colspan="colSpanTotal" class="py-10 text-center">
                <div v-if="error" class="mx-auto flex max-w-md flex-col items-center gap-2 px-4">
                  <AlertCircle class="h-6 w-6 text-rose-700" aria-hidden="true" />
                  <p class="text-xs font-medium text-rose-700" role="alert">
                    {{ typeof error === 'string' ? error : (errorMessage || 'Não foi possível carregar os dados.') }}
                  </p>
                  <button
                    type="button"
                    class="mt-1 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-brand-focus hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
                    @click="emit('retry')"
                  >
                    <RotateCw class="h-3.5 w-3.5" aria-hidden="true" />
                    Tentar novamente
                  </button>
                </div>
                <span v-else class="text-slate-600">
                  {{ (filtersCount > 0 || searchQuery.trim() !== '') ? 'Nenhum resultado encontrado para o filtro.' : 'Nenhum registro encontrado.' }}
                </span>
              </td>
            </tr>
          </template>
        </tbody>

        <!-- Rodapé com Totalizadores — apenas colunas isNumeric permitem clique direito -->
        <tfoot>
          <tr class="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 divide-x divide-slate-200">
            <td v-if="mostrarColunaExpansao" class="bg-slate-100/90"></td>
            <td
              v-for="col in columns"
              :key="col.id"
              :style="getColumnStyle(col)"
              :class="[
                'py-1.5 px-2.5 relative truncate transition-colors',
                col.isNumeric
                  ? 'cursor-context-menu group hover:bg-lime-50/80'
                  : 'cursor-default',
                col.align === 'right' ? 'text-right' : 'text-left'
              ]"
              :title="col.isNumeric ? 'Clique com o botão direito para escolher operação (Soma, Média, Contagem...)' : undefined"
              @contextmenu="col.isNumeric ? openFooterContextMenu($event, col.id) : $event.preventDefault()"
            >
              <template v-if="col.isNumeric">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-[10px] text-lime-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Calculator class="h-3 w-3 inline" />
                  </span>
                  <span class="text-xs text-slate-900 tabular-nums font-mono font-bold truncate">
                    {{ getFooterValue(col) || '-' }}
                  </span>
                </div>
              </template>
            </td>
            <td v-if="$slots.actions" class="py-1.5 px-2.5" :class="classesAcoesRodape"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Barra de Paginação Idêntica à Imagem do Usuário -->
    <div class="px-3.5 py-2 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
      <!-- Indicador à Esquerda: Mostrando 1 a 5 de 33 entradas exibidas (2 níveis de agrupamento) -->
      <div class="text-slate-600 text-[11px]">
        Mostrando <strong class="text-slate-900">{{ rangeStart }}</strong> a <strong class="text-slate-900">{{ rangeEnd }}</strong> de <strong class="text-slate-900">{{ totalEntries }}</strong> entradas exibidas
        <span v-if="groupedColumns.length > 0" class="text-lime-700 font-semibold ml-1">
          ({{ groupedColumns.length }} {{ groupedColumns.length === 1 ? 'nível' : 'níveis' }} de agrupamento)
        </span>
      </div>

      <!-- Controles de Navegação à Direita -->
      <div class="flex max-w-full flex-wrap items-center gap-2.5 text-[11px]">
        <!-- Linhas por Página -->
        <div class="flex items-center gap-1.5 text-slate-600">
          <label :for="pageSizeId">Linhas por página:</label>
          <select
            :id="pageSizeId"
            v-model="pageSize"
            class="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 cursor-pointer shadow-2xs hover:border-slate-400"
            @change="currentPage = 1"
          >
            <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </div>

        <span class="text-slate-300">|</span>

        <!-- Página Atual -->
        <span class="text-slate-700 font-medium">
          Página <strong class="text-slate-900">{{ currentPage }}</strong> de <strong class="text-slate-900">{{ totalPages }}</strong>
        </span>

        <!-- Botões de Navegação Conforme Mockup [ « ] [ < ] [ > ] [ » ] -->
        <div class="flex items-center gap-1">
          <button
            type="button"
            :disabled="currentPage === 1"
            class="h-6 w-6 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 shadow-2xs transition-colors"
            title="Primeira Página"
            @click="currentPage = 1"
          >
            <ChevronsLeft class="h-3 w-3" />
          </button>
          <button
            type="button"
            :disabled="currentPage === 1"
            class="h-6 w-6 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 shadow-2xs transition-colors"
            title="Página Anterior"
            @click="currentPage--"
          >
            <ChevronLeft class="h-3 w-3" />
          </button>
          <button
            type="button"
            :disabled="currentPage === totalPages"
            class="h-6 w-6 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 shadow-2xs transition-colors"
            title="Próxima Página"
            @click="currentPage++"
          >
            <ChevronRight class="h-3 w-3" />
          </button>
          <button
            type="button"
            :disabled="currentPage === totalPages"
            class="h-6 w-6 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 shadow-2xs transition-colors"
            title="Última Página"
            @click="currentPage = totalPages"
          >
            <ChevronsRight class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Menu de Contexto Flutuante (DevExpress cxGrid ContextMenu) -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
        class="fixed z-50 bg-white border border-slate-300 rounded-lg shadow-2xl py-1 w-48 text-xs font-medium text-slate-800 animate-in fade-in zoom-in-95 duration-100"
      >
        <div class="px-3 py-1.5 border-b border-slate-100 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
          Totalizador (DevExpress cxGrid)
        </div>
        <button
          type="button"
          class="w-full text-left px-3 py-1.5 hover:bg-lime-50 hover:text-lime-900 flex items-center justify-between cursor-pointer"
          @click="selectAggregate('SUM')"
        >
          <span>Soma (SUM)</span>
          <span class="text-[10px] text-slate-500 font-mono">∑</span>
        </button>
        <button
          type="button"
          class="w-full text-left px-3 py-1.5 hover:bg-lime-50 hover:text-lime-900 flex items-center justify-between cursor-pointer"
          @click="selectAggregate('AVG')"
        >
          <span>Média (AVG)</span>
          <span class="text-[10px] text-slate-500 font-mono">x̄</span>
        </button>
        <button
          type="button"
          class="w-full text-left px-3 py-1.5 hover:bg-lime-50 hover:text-lime-900 flex items-center justify-between cursor-pointer"
          @click="selectAggregate('COUNT')"
        >
          <span>Contagem (COUNT)</span>
          <span class="text-[10px] text-slate-500 font-mono">N</span>
        </button>
        <button
          type="button"
          class="w-full text-left px-3 py-1.5 hover:bg-lime-50 hover:text-lime-900 flex items-center justify-between cursor-pointer"
          @click="selectAggregate('MIN')"
        >
          <span>Mínimo (MIN)</span>
          <span class="text-[10px] text-slate-500 font-mono">↓</span>
        </button>
        <button
          type="button"
          class="w-full text-left px-3 py-1.5 hover:bg-lime-50 hover:text-lime-900 flex items-center justify-between cursor-pointer"
          @click="selectAggregate('MAX')"
        >
          <span>Máximo (MAX)</span>
          <span class="text-[10px] text-slate-500 font-mono">↑</span>
        </button>
        <div class="border-t border-slate-100 my-1"></div>
        <button
          type="button"
          class="w-full text-left px-3 py-1.5 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-between text-slate-600 cursor-pointer"
          @click="selectAggregate('NONE')"
        >
          <span>Nenhum (Limpar)</span>
          <span class="text-[10px] text-slate-500">✕</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>
