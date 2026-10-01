export type AggregateOperation = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'NONE'

export interface SortRule {
  columnId: string
  direction: 'asc' | 'desc'
}

export interface ColumnDef<T = any> {
  id: string
  header: string
  accessorKey: string
  align?: 'left' | 'center' | 'right'
  width?: number | string
  minWidth?: number
  isNumeric?: boolean
  groupable?: boolean
  sortable?: boolean
  format?: (val: any, row: T) => string
}

export interface GroupNode<T = any> {
  id: string
  groupKey: string
  groupValue: any
  level: number
  items: T[]
  children?: GroupNode<T>[]
  count: number
  expanded: boolean
}

/**
 * Realiza ordenação multi-coluna sequencial e encadeada
 */
export function sortMultiColumn<T = any>(
  data: T[],
  sortRules: SortRule[],
  columns: ColumnDef<T>[]
): T[] {
  if (!sortRules || sortRules.length === 0) {
    return [...data]
  }

  const columnsMap = new Map<string, ColumnDef<T>>()
  columns.forEach((col) => columnsMap.set(col.id, col))

  return [...data].sort((a: any, b: any) => {
    for (const rule of sortRules) {
      const col = columnsMap.get(rule.columnId)
      if (!col) continue

      const valA = a[col.accessorKey]
      const valB = b[col.accessorKey]

      if (valA === valB) continue
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      let diff = 0
      if (col.isNumeric) {
        const numA = typeof valA === 'number' ? valA : parseFloat(String(valA).replace(/[^\d.-]/g, '')) || 0
        const numB = typeof valB === 'number' ? valB : parseFloat(String(valB).replace(/[^\d.-]/g, '')) || 0
        diff = numA - numB
      } else {
        diff = String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true, sensitivity: 'base' })
      }

      if (diff !== 0) {
        return rule.direction === 'asc' ? diff : -diff
      }
    }
    return 0
  })
}

/**
 * Calcula totalizadores sob demanda no estilo DevExpress cxGrid
 */
export function calculateAggregate<T = any>(
  data: T[],
  accessorKey: string,
  operation: AggregateOperation
): string {
  if (!data || data.length === 0 || operation === 'NONE') return ''

  const rawValues = data
    .map((item: any) => item[accessorKey])
    .filter((v) => v !== undefined && v !== null && v !== '')

  if (operation === 'COUNT') {
    return `CONTAGEM: ${rawValues.length}`
  }

  const numbers = rawValues.map((v) => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const clean = v.replace(/[R$\s.]/g, '').replace(',', '.')
      const n = parseFloat(clean)
      return isNaN(n) ? 0 : n
    }
    return 0
  })

  if (numbers.length === 0) return ''

  switch (operation) {
    case 'SUM': {
      const sum = numbers.reduce((acc, curr) => acc + curr, 0)
      return `SOMA: R$ ${sum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    case 'AVG': {
      const sum = numbers.reduce((acc, curr) => acc + curr, 0)
      const avg = sum / numbers.length
      return `MÉDIA: R$ ${avg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    case 'MIN': {
      const min = Math.min(...numbers)
      return `MÍN: R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    case 'MAX': {
      const max = Math.max(...numbers)
      return `MÁX: R$ ${max.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    default:
      return ''
  }
}

/**
 * Agrupa dados recursivamente em até 3 níveis hierárquicos
 */
export function groupDataHierarchical<T = any>(
  data: T[],
  groupKeys: string[],
  level: number = 1,
  prefix: string = ''
): GroupNode<T>[] {
  if (groupKeys.length === 0 || level > 3) {
    return []
  }

  const currentKey = groupKeys[0]
  if (currentKey === undefined) {
    return []
  }
  const remainingKeys = groupKeys.slice(1)

  // Mapear grupos preservando ordenação de entrada
  const groupsMap = new Map<any, T[]>()

  data.forEach((item: any) => {
    const val = item[currentKey] !== undefined ? item[currentKey] : '(Vazio)'
    if (!groupsMap.has(val)) {
      groupsMap.set(val, [])
    }
    groupsMap.get(val)!.push(item)
  })

  const nodes: GroupNode<T>[] = []

  groupsMap.forEach((items, groupValue) => {
    const nodeId = `${prefix}${currentKey}_${groupValue}_${level}`
    const hasMoreGroups = remainingKeys.length > 0 && level < 3

    nodes.push({
      id: nodeId,
      groupKey: currentKey,
      groupValue,
      level,
      items,
      count: items.length,
      expanded: true,
      children: hasMoreGroups
        ? groupDataHierarchical(items, remainingKeys, level + 1, `${nodeId}_`)
        : undefined
    })
  })

  return nodes
}
