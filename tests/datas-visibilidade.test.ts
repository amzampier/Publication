import { describe, expect, it } from 'vitest'
import { paraIso, paraMs } from '../server/utils/datas'
import { contextoPublicado, itemVisivelNoPortal } from '../server/utils/visibilidade-publica'

describe('normalizador de datas', () => {
  it('aceita Date do mysql2', () => {
    const data = new Date('2026-12-28T00:00:00.000Z')
    expect(paraIso(data)).toBe('2026-12-28T00:00:00.000Z')
    expect(paraMs(data)).toBe(data.getTime())
  })

  it('aceita string SQL com espaço', () => {
    expect(paraIso('2026-12-28 00:00:00')).not.toBeNull()
    expect(paraMs('2026-12-28 00:00:00')).not.toBeNull()
  })

  it('aceita ISO e rejeita vazio/inválido', () => {
    expect(paraIso('2026-12-28T00:00:00.000Z')).toBe('2026-12-28T00:00:00.000Z')
    expect(paraIso(null)).toBeNull()
    expect(paraIso('')).toBeNull()
    expect(paraIso('data-invalida')).toBeNull()
  })
})

describe('visibilidade pública', () => {
  const passado = new Date(Date.now() - 60_000).toISOString()
  const futuro = new Date(Date.now() + 60_000).toISOString()

  it('pai publicado e efetivo é visível', () => {
    expect(contextoPublicado({ id: '1', codigo: 'RW-1', nome: 'R', status: 'Publicado', arquivada: false, publicadoEm: passado })).toBe(true)
  })

  it('pai arquivado ou futuro não é visível', () => {
    expect(contextoPublicado({ id: '1', codigo: 'RW-1', nome: 'R', status: 'Publicado', arquivada: true, publicadoEm: passado })).toBe(false)
    expect(contextoPublicado({ id: '1', codigo: 'RW-1', nome: 'R', status: 'Publicado', arquivada: false, publicadoEm: futuro })).toBe(false)
  })

  it('chamada exige ao menos um pai visível', () => {
    const pai = { id: '1', codigo: 'RW-1', nome: 'R', status: 'Publicado', arquivada: false, publicadoEm: passado }
    expect(itemVisivelNoPortal('Publicado', { release: pai }, passado)).toBe(true)
    expect(itemVisivelNoPortal('Publicado', { release: { ...pai, arquivada: true } }, passado)).toBe(false)
    expect(itemVisivelNoPortal('Publicado', { release: pai }, futuro)).toBe(false)
    expect(itemVisivelNoPortal('Revisar', { release: pai }, passado)).toBe(false)
  })
})