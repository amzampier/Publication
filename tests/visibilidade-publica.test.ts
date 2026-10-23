import { describe, expect, it } from 'vitest'
import {
  contextoPublicado,
  itemVisivelNoPortal,
  sqlVinculoPublicado
} from '../server/utils/visibilidade-publica'
import type { ContextoVinculo } from '../shared/esteira-revisao'

const pai = (overrides: Partial<ContextoVinculo> = {}): ContextoVinculo => ({
  id: 'pai-1',
  codigo: 'RW-44/2026',
  nome: 'Release',
  status: 'Publicado',
  arquivada: false,
  ...overrides
})

describe('visibilidade pública', () => {
  it('considera publicado apenas com status Publicado e não arquivado', () => {
    expect(contextoPublicado(pai())).toBe(true)
    expect(contextoPublicado(pai({ status: 'Em Revisão' }))).toBe(false)
    expect(contextoPublicado(pai({ arquivada: true }))).toBe(false)
    expect(contextoPublicado(null)).toBe(false)
  })

  it('exige chamada Publicado e ao menos um pai visível', () => {
    expect(itemVisivelNoPortal('Publicado', { release: pai() })).toBe(true)
    expect(itemVisivelNoPortal('Publicado', { manual: pai(), projeto: pai({ arquivada: true }) })).toBe(true)
    expect(itemVisivelNoPortal('Revisar', { release: pai() })).toBe(false)
    expect(itemVisivelNoPortal('Publicado', { release: pai({ arquivada: true }) })).toBe(false)
    expect(itemVisivelNoPortal('Publicado', null)).toBe(false)
  })

  it('preserva a visibilidade quando há múltiplos vínculos e um pai ativo', () => {
    expect(
      itemVisivelNoPortal('Publicado', {
        release: pai({ arquivada: true }),
        manual: pai({ id: 'manual-1', codigo: 'MAN-10/2026' })
      })
    ).toBe(true)
  })

  it('gera a expressão SQL para os três vínculos', () => {
    const sql = sqlVinculoPublicado('e')
    expect(sql).toContain('release_week')
    expect(sql).toContain('manuais_mensal')
    expect(sql).toContain('projetos_escopo')
    expect(sql).toContain("r.status = 'Publicado'")
    expect(sql).toContain('r.arquivada = 0')
  })
})