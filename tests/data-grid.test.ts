import { describe, expect, it } from 'vitest'
import { formatarValorGrupo, groupDataHierarchical } from '../app/utils/dataGrid'
import { ordemChamadas } from '../shared/ordenacao-chamadas'

describe('agrupamento e ordenação de Chamadas', () => {
  it('monta níveis hierárquicos sem perder itens', () => {
    const dados = [
      { id: 1, status: 'Revisar', tipo: 'Melhoria' },
      { id: 2, status: 'Revisar', tipo: 'Erro' },
      { id: 3, status: 'Aprovado', tipo: 'Melhoria' }
    ]
    const niveis = groupDataHierarchical(dados, ['status', 'tipo'])
    expect(niveis).toHaveLength(2)
    const revisar = niveis.find((n) => n.groupValue === 'Revisar')
    expect(revisar?.count).toBe(2)
    expect(revisar?.children).toHaveLength(2)
  })

  it('formata data do grupo em pt-BR e respeita format', () => {
    expect(formatarValorGrupo('2026-10-26')).toBe('26/10/2026')
    expect(formatarValorGrupo('2026-10-26', () => 'custom')).toBe('custom')
    expect(formatarValorGrupo(null)).toBe('')
  })

  it('whitelist de ordenação evita injeção e mantém desempate', () => {
    expect(ordemChamadas('titulo', 'desc')).toBe('e.titulo DESC, e.chamada ASC')
    expect(ordemChamadas('invalido', 'asc')).toBe('e.chamada ASC, e.chamada ASC')
  })
})