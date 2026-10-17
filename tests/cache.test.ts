import { describe, it, expect } from 'vitest'
import { cacheado } from '../server/utils/cache'

describe('cacheado', () => {
  it('produz uma vez e reaproveita dentro do TTL', async () => {
    let chamadas = 0
    const produzir = async () => {
      chamadas++
      return { n: chamadas }
    }
    const a = await cacheado('t1', 10_000, produzir)
    const b = await cacheado('t1', 10_000, produzir)
    expect(a).toBe(b)
    expect(chamadas).toBe(1)
  })
  it('reproduz após o TTL expirar', async () => {
    let chamadas = 0
    const produzir = async () => ++chamadas
    await cacheado('t2', -1, produzir) // expira imediatamente
    const segundo = await cacheado('t2', -1, produzir)
    expect(segundo).toBe(2)
    expect(chamadas).toBe(2)
  })
})