import { describe, it, expect } from 'vitest'
import { formatarCodigo, numeroDoCodigo, proximoCodigo } from '../server/utils/softwares'

describe('código de software (SFT-XXX)', () => {
  it('formata com padding de 3 dígitos', () => {
    expect(formatarCodigo(1)).toBe('SFT-001')
    expect(formatarCodigo(10)).toBe('SFT-010')
    expect(formatarCodigo(100)).toBe('SFT-100')
  })

  it('cresce naturalmente além de 3 dígitos', () => {
    expect(formatarCodigo(1000)).toBe('SFT-1000')
  })

  it('extrai o número do código', () => {
    expect(numeroDoCodigo('SFT-007')).toBe(7)
    expect(numeroDoCodigo('SFT-1000')).toBe(1000)
    expect(numeroDoCodigo('inválido')).toBe(0)
    expect(numeroDoCodigo(null)).toBe(0)
  })

  it('calcula o próximo código a partir dos existentes', () => {
    expect(proximoCodigo([])).toBe('SFT-001')
    expect(proximoCodigo(['SFT-001', 'SFT-002', 'SFT-003'])).toBe('SFT-004')
    // não depende da ordem nem de buracos na sequência
    expect(proximoCodigo(['SFT-005', 'SFT-001', 'SFT-002'])).toBe('SFT-006')
    // ignora valores que não são códigos
    expect(proximoCodigo(['SFT-009', 'ruído'])).toBe('SFT-010')
  })
})
