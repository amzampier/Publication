import { describe, expect, it, vi } from 'vitest'
import { cacheado, invalidarCache, invalidarCachePrefixo } from '../server/utils/cache'
import { inserirEmLotes } from '../server/utils/db'

describe('cache com single-flight', () => {
  it('deduplica chamadas concorrentes da mesma chave', async () => {
    invalidarCache()
    let chamadas = 0
    const produzir = async () => {
      chamadas += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return { valor: 42 }
    }

    const [a, b, c] = await Promise.all([
      cacheado('teste-single-flight', 1000, produzir),
      cacheado('teste-single-flight', 1000, produzir),
      cacheado('teste-single-flight', 1000, produzir)
    ])

    expect(chamadas).toBe(1)
    expect(a).toEqual({ valor: 42 })
    expect(b).toEqual(a)
    expect(c).toEqual(a)
  })

  it('invalida a chave e volta a produzir', async () => {
    invalidarCache()
    let chamadas = 0
    const produzir = async () => ++chamadas
    expect(await cacheado('teste-invalidacao', 1000, produzir)).toBe(1)
    invalidarCache('teste-invalidacao')
    expect(await cacheado('teste-invalidacao', 1000, produzir)).toBe(2)
  })

  it('invalida apenas as chaves do prefixo', async () => {
    invalidarCache()
    let painel = 0
    let outra = 0
    await cacheado('painel:fluxo', 1000, async () => ++painel)
    await cacheado('painel:anos-publicacoes:r', 1000, async () => ++painel)
    await cacheado('outra-chave', 1000, async () => ++outra)

    invalidarCachePrefixo('painel')

    expect(await cacheado('painel:fluxo', 1000, async () => ++painel)).toBe(3)
    expect(await cacheado('outra-chave', 1000, async () => ++outra)).toBe(1)
  })
})

describe('inserirEmLotes', () => {
  it('interrompe a gravação quando um bloco falha', async () => {
    let chamadas = 0
    const executor = {
      query: vi.fn(async () => {
        chamadas += 1
        if (chamadas === 2) throw new Error('falha induzida')
      })
    }
    await expect(
      inserirEmLotes(
        executor,
        'INSERT INTO teste (a, b) VALUES',
        2,
        Array.from({ length: 300 }, (_, i) => [i, i]),
        100
      )
    ).rejects.toThrow('falha induzida')
    expect(chamadas).toBe(2)
  })

  it('divide as linhas em blocos e preserva a ordem', async () => {
    const consultas: Array<{ sql: string; values: unknown[] }> = []
    const executor = {
      query: vi.fn(async (sql: string, values: unknown[]) => {
        consultas.push({ sql, values })
      })
    }

    const linhas = Array.from({ length: 500 }, (_, i) => [i, `linha-${i}`])
    await inserirEmLotes(executor, 'INSERT INTO teste (a, b) VALUES', 2, linhas, 150)

    expect(consultas).toHaveLength(4)
    expect(consultas[0]?.values.slice(0, 2)).toEqual([0, 'linha-0'])
    expect(consultas[3]?.values.slice(-2)).toEqual([499, 'linha-499'])
    expect(consultas.every((c) => (c.values.length / 2) <= 150)).toBe(true)
  })
})
