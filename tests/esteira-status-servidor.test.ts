import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  query: vi.fn()
}))

vi.mock('../server/utils/db', () => ({
  query: mocks.query,
  getTransaction: vi.fn(),
  inserirEmLotes: vi.fn()
}))

vi.mock('../server/utils/midias', () => ({
  carregarMidiasPorItem: vi.fn(),
  carregarResumoMidiasPorItem: vi.fn(async () => new Map()),
  sincronizarMidias: vi.fn(),
  urlReferenciadaPorOutraChamada: vi.fn()
}))

import { listarChamadasParaEsteira } from '../server/utils/lancar-chamadas'

describe('filtro de status da Esteira no servidor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aplica status antes de LIMIT/OFFSET e no COUNT', async () => {
    mocks.query.mockImplementation(async (sql: string) => {
      if (String(sql).includes('COUNT(*) AS total')) return [{ total: 1 }]
      return []
    })

    const resultado = await listarChamadasParaEsteira(2, 10, 'Publicado')
    expect(resultado.total).toBe(1)

    const chamadasSql = mocks.query.mock.calls.map(([sql]) => String(sql))
    expect(chamadasSql.some((sql) => sql.includes('e.status = ?') && sql.includes('LIMIT'))).toBe(true)
    expect(chamadasSql.some((sql) => sql.includes('e.status = ?') && sql.includes('COUNT(*)'))).toBe(true)

    const lista = mocks.query.mock.calls.find(
      ([sql]) => String(sql).includes('e.status = ?') && String(sql).includes('LIMIT')
    )
    expect(lista?.[1]).toEqual(['Publicado', 10, 10])

    const contagem = mocks.query.mock.calls.find(
      ([sql]) => String(sql).includes('e.status = ?') && String(sql).includes('COUNT(*)')
    )
    expect(contagem?.[1]).toEqual(['Publicado'])
  })
})
