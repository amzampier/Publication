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
  publicadoEm: '2026-10-01T00:00:00.000Z',
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
    expect(itemVisivelNoPortal('Publicado', { release: pai() }, '2026-10-01T00:00:00.000Z')).toBe(true)
    expect(itemVisivelNoPortal('Publicado', { manual: pai(), projeto: pai({ arquivada: true }) }, '2026-10-01T00:00:00.000Z')).toBe(true)
    expect(itemVisivelNoPortal('Revisar', { release: pai() }, '2026-10-01T00:00:00.000Z')).toBe(false)
    expect(itemVisivelNoPortal('Publicado', { release: pai({ arquivada: true }) }, '2026-10-01T00:00:00.000Z')).toBe(false)
    expect(itemVisivelNoPortal('Publicado', null, '2026-10-01T00:00:00.000Z')).toBe(false)
  })

  it('oculta a filha quando o pai manual ou projeto está arquivado', () => {
    const ts = '2026-10-01T00:00:00.000Z'
    expect(
      itemVisivelNoPortal('Publicado', { manual: pai({ id: 'manual-1', codigo: 'MAN-10/2026', arquivada: true }) }, ts)
    ).toBe(false)
    expect(
      itemVisivelNoPortal('Publicado', { projeto: pai({ id: 'projeto-1', codigo: 'PE-2026.01', arquivada: true }) }, ts)
    ).toBe(false)
  })

  it('preserva a visibilidade quando há múltiplos vínculos e um pai ativo', () => {
    expect(
      itemVisivelNoPortal('Publicado', {
        release: pai({ arquivada: true }),
        manual: pai({ id: 'manual-1', codigo: 'MAN-10/2026' })
      }, '2026-10-01T00:00:00.000Z')
    ).toBe(true)
    expect(
      itemVisivelNoPortal('Publicado', {
        manual: pai({ id: 'manual-1', codigo: 'MAN-10/2026', arquivada: true }),
        projeto: pai({ id: 'projeto-1', codigo: 'PE-2026.01' })
      }, '2026-10-01T00:00:00.000Z')
    ).toBe(true)
  })

  it('exige ao menos um pai publicado quando há vínculo duplo', () => {
    const ts = '2026-10-01T00:00:00.000Z'
    expect(
      itemVisivelNoPortal('Publicado', {
        release: pai({ status: 'Rascunho' }),
        manual: pai({ id: 'manual-1', codigo: 'MAN-10/2026' })
      }, ts)
    ).toBe(true)
    expect(
      itemVisivelNoPortal('Publicado', {
        release: pai({ status: 'Em Revisão' }),
        manual: pai({ id: 'manual-1', codigo: 'MAN-10/2026', status: 'Aprovado' })
      }, ts)
    ).toBe(false)
    expect(
      itemVisivelNoPortal('Publicado', {
        release: pai({ arquivada: true }),
        manual: pai({ id: 'manual-1', codigo: 'MAN-10/2026' })
      }, ts)
    ).toBe(true)
    expect(
      itemVisivelNoPortal('Publicado', {
        release: pai(),
        manual: pai({ id: 'manual-1', codigo: 'MAN-10/2026' })
      }, '2099-01-01T00:00:00.000Z')
    ).toBe(false)
  })

  it('gera a expressão SQL para os três vínculos', () => {
    const sql = sqlVinculoPublicado('e')
    expect(sql).toContain('release_week')
    expect(sql).toContain('manuais_mensal')
    expect(sql).toContain('projetos_escopo')
    expect(sql).toContain("r.status = 'Publicado'")
    expect(sql).toContain('r.arquivada = 0')
    expect(sql).toContain('r.publicado_em <= NOW(6)')
    expect(sql).toContain('m.arquivada = 0')
    expect(sql).toContain('m.publicado_em <= NOW(6)')
    expect(sql).toContain('p.arquivada = 0')
    expect(sql).toContain('p.publicado_em <= NOW(6)')
  })

  it('oculta publicação futura e ausência de carimbo', () => {
    const futuro = pai({ publicadoEm: '2099-01-01T00:00:00.000Z' })
    expect(contextoPublicado(futuro)).toBe(false)
    expect(itemVisivelNoPortal('Publicado', { release: futuro }, '2026-10-01T00:00:00.000Z')).toBe(false)
    expect(itemVisivelNoPortal('Publicado', { release: pai() }, null)).toBe(false)
  })
})