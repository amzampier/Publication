import { describe, it, expect } from 'vitest'
import {
  REGIOES,
  SITUACOES_PARCEIRO,
  UFS,
  formatarCodigoParceiro,
  numeroDoCodigoParceiro,
  proximoCodigoParceiro,
  regiaoDaUf,
  resolverRegiao,
  validarEstadoParceiro,
  validarLinhaImportacaoParceiro,
  validarNomeFantasiaParceiro,
  validarRazaoSocialParceiro,
  validarRegiaoParceiro,
  validarSituacaoParceiro
} from '../server/utils/parceiros'

interface ErroApi {
  statusCode?: number
  statusMessage?: string
}

const capturar = (fn: () => unknown): ErroApi => {
  try {
    fn()
  } catch (erro) {
    return erro as ErroApi
  }
  throw new Error('esperava um erro')
}

describe('código de parceiro (PAR-XXX)', () => {
  it('formata com padding de 3 dígitos', () => {
    expect(formatarCodigoParceiro(1)).toBe('PAR-001')
    expect(formatarCodigoParceiro(10)).toBe('PAR-010')
    expect(formatarCodigoParceiro(1000)).toBe('PAR-1000')
  })

  it('extrai o número do código', () => {
    expect(numeroDoCodigoParceiro('PAR-007')).toBe(7)
    expect(numeroDoCodigoParceiro('inválido')).toBe(0)
    expect(numeroDoCodigoParceiro(null)).toBe(0)
  })

  it('calcula o próximo código a partir dos existentes', () => {
    expect(proximoCodigoParceiro([])).toBe('PAR-001')
    expect(proximoCodigoParceiro(['PAR-005', 'PAR-001', 'PAR-002'])).toBe('PAR-006')
    expect(proximoCodigoParceiro(['PAR-009', 'ruído'])).toBe('PAR-010')
  })
})

describe('região por UF', () => {
  it('mapeia todas as 27 UFs para uma das 5 regiões', () => {
    expect(UFS).toHaveLength(27)
    for (const uf of UFS) {
      expect(REGIOES).toContain(regiaoDaUf(uf))
    }
  })

  it('resolve exemplos', () => {
    expect(regiaoDaUf('SP')).toBe('Sudeste')
    expect(regiaoDaUf('am')).toBe('Norte')
    expect(regiaoDaUf('RS')).toBe('Sul')
    expect(regiaoDaUf('')).toBe('')
  })

  it('recusa região divergente da UF', () => {
    expect(resolverRegiao('SP', 'Sudeste')).toBe('Sudeste')
    expect(capturar(() => resolverRegiao('SP', 'Sul')).statusCode).toBe(400)
  })
})

describe('validadores de parceiro', () => {
  it('razão social obrigatória com trim', () => {
    expect(validarRazaoSocialParceiro('  Nexus Corp  ')).toBe('Nexus Corp')
    expect(capturar(() => validarRazaoSocialParceiro('')).statusCode).toBe(400)
    expect(capturar(() => validarRazaoSocialParceiro('   ')).statusCode).toBe(400)
  })

  it('nome fantasia obrigatório', () => {
    expect(validarNomeFantasiaParceiro(' Nexus ')).toBe('Nexus')
    expect(capturar(() => validarNomeFantasiaParceiro(undefined)).statusCode).toBe(400)
  })

  it('situação restrita ao domínio', () => {
    for (const s of SITUACOES_PARCEIRO) expect(validarSituacaoParceiro(s)).toBe(s)
    expect(capturar(() => validarSituacaoParceiro('Suspenso')).statusCode).toBe(400)
  })

  it('estado aceita vazio ou UF válida', () => {
    expect(validarEstadoParceiro('')).toBe('')
    expect(validarEstadoParceiro('sp')).toBe('SP')
    expect(capturar(() => validarEstadoParceiro('ZZ')).statusCode).toBe(400)
  })

  it('região restrita ao domínio (vazio permitido)', () => {
    expect(validarRegiaoParceiro('Sudeste')).toBe('Sudeste')
    expect(validarRegiaoParceiro('')).toBe('')
    expect(capturar(() => validarRegiaoParceiro('Litoral')).statusCode).toBe(400)
  })
})

describe('validarLinhaImportacaoParceiro', () => {
  it('normaliza a linha válida e deriva a região da UF', () => {
    expect(
      validarLinhaImportacaoParceiro({
        razao_social: ' Nexus Corp ',
        nome_fantasia: 'Nexus',
        cidade: 'São Paulo',
        estado: 'SP',
        situacao: 'Ativo'
      })
    ).toEqual({
      razao_social: 'Nexus Corp',
      nome_fantasia: 'Nexus',
      cidade: 'São Paulo',
      estado: 'SP',
      regiao: 'Sudeste',
      situacao: 'Ativo'
    })
  })

  it('recusa situação inválida', () => {
    expect(
      capturar(() =>
        validarLinhaImportacaoParceiro({
          razao_social: 'X',
          nome_fantasia: 'Y',
          estado: 'SP',
          situacao: 'X'
        })
      ).statusCode
    ).toBe(400)
  })

  it('recusa região incoerente com a UF', () => {
    expect(
      capturar(() =>
        validarLinhaImportacaoParceiro({
          razao_social: 'X',
          nome_fantasia: 'Y',
          estado: 'SP',
          regiao: 'Sul',
          situacao: 'Ativo'
        })
      ).statusCode
    ).toBe(400)
  })
})
