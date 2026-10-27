import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('../server/utils/db', () => ({ query: mocks.query }))

import {
  listarOpcoesPorTipo,
  normalizarBusca,
  normalizarLimite,
  normalizarPagina
} from '../server/utils/opcoes-chamadas'

describe('opÃ§Ãµes remotas de Chamadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.query.mockImplementation((sql: string) => {
      if (String(sql).includes('COUNT(*)')) return Promise.resolve([{ total: 3 }])
      return Promise.resolve([
        { codigo: 'SFT-001', descricao: 'Software A' },
        { codigo: 'SFT-002', descricao: 'Software B' }
      ])
    })
  })

  it('normaliza limite com padrÃ£o 20 e teto 50', () => {
    expect(normalizarLimite(undefined)).toBe(20)
    expect(normalizarLimite('0')).toBe(20)
    expect(normalizarLimite('10')).toBe(10)
    expect(normalizarLimite('999')).toBe(50)
    expect(normalizarBusca('  termo  ')).toBe('termo')
    expect(normalizarPagina(undefined)).toBe(1)
    expect(normalizarPagina('0')).toBe(1)
    expect(normalizarPagina('3')).toBe(3)
  })

  it('busca em um catÃ¡logo com escape, limite e total', async () => {
    const pagina = await listarOpcoesPorTipo('softwares', 'a%b', '10')

    expect(pagina.total).toBe(3)
    expect(pagina.hasMore).toBe(false)
    expect(pagina.itens).toEqual([
      { id: 'SFT-001', label: 'Software A', sigla: 'SFT-001' },
      { id: 'SFT-002', label: 'Software B', sigla: 'SFT-002' }
    ])

    const sqls = mocks.query.mock.calls.map(([sql]) => String(sql))
    expect(sqls.some((sql) => sql.includes("situacao = 'Ativo'"))).toBe(true)
    expect(sqls.some((sql) => sql.includes('codigo LIKE ?'))).toBe(true)
    expect(sqls.some((sql) => sql.includes('LIMIT ?'))).toBe(true)
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ? OFFSET ?'),
      ['%a\\%b%', '%a\\%b%', 11, 0]
    )
  })

  it('inclui razÃ£o social na busca de parceiros', async () => {
    mocks.query.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([])
    await listarOpcoesPorTipo('parceiros', 'acme', 20)
    const sqls = mocks.query.mock.calls.map(([sql]) => String(sql))
    expect(sqls.some((sql) => sql.includes('razao_social LIKE ?'))).toBe(true)
  })
})
