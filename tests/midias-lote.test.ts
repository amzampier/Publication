import { describe, expect, it, vi } from 'vitest'
import { sincronizarMidias } from '../server/utils/midias'

describe('sincronizarMidias', () => {
  it('faz upsert multi-row preservando ordem e capa', async () => {
    const consultas: Array<{ sql: string; values?: unknown[] }> = []
    const executor = {
      query: vi.fn(async (sql: string, values?: unknown[]) => {
        consultas.push({ sql, values })
      })
    }
    const urls = Array.from(
      { length: 100 },
      (_, i) => `/uploads/chamadas/2026/10/imagem-${i}.png`
    )

    await sincronizarMidias(executor, 'chamada-1', urls)

    expect(consultas).toHaveLength(2)
    expect(consultas[0]?.sql).toContain('DELETE FROM anexos_midias')
    expect(consultas[1]?.sql).toContain('VALUES')
    expect(consultas[1]?.values).toHaveLength(600)
    expect(consultas[1]?.values?.slice(0, 6)).toEqual([
      'chamada-1',
      urls[0],
      'imagem-0.png',
      'image/png',
      0,
      1
    ])
    expect(consultas[1]?.values?.slice(-6)?.slice(-2)).toEqual([99, 0])
  })
})
