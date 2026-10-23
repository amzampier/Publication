import { describe, expect, it } from 'vitest'
import { varianteStatus } from '../shared/status-badge'

describe('mapa canônico de status', () => {
  it('usa a variante de cada domínio', () => {
    expect(varianteStatus('release', 'Em Revisão')).toBe('inReview')
    expect(varianteStatus('release', 'Publicado')).toBe('publicado')
    expect(varianteStatus('manual', 'Rascunho')).toBe('neutral')
    expect(varianteStatus('manual', 'Alterações Solicitadas')).toBe('alteracoes')
    expect(varianteStatus('escopo', 'Concluído')).toBe('done')
    expect(varianteStatus('chamada', 'Publicar')).toBe('done')
    expect(varianteStatus('chamada', 'Recusado')).toBe('blocked')
  })

  it('usa neutral para status desconhecido', () => {
    expect(varianteStatus('release', 'Inexistente')).toBe('neutral')
  })
})