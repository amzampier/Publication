import { describe, expect, it } from 'vitest'
import {
  normalizarPagina,
  normalizarPorPagina,
  normalizarSistema,
  resumirEscopo,
  rotuloChamadas,
  rotuloEvidencias,
  rotuloImpacto,
  rotuloSistemas,
  sistemaPertenceAoEscopo,
  varianteImpacto
} from '../shared/publico'
import type { PublicoEscopoDetalhe } from '../shared/publico'

const escopo = (overrides: Partial<PublicoEscopoDetalhe> = {}): PublicoEscopoDetalhe => ({
  id: 'escopo-1',
  codigo: 'PE-2026.01',
  nome: 'Escopo de Projeto Anual 2026',
  versao: 'v2026.1',
  ano: 2026,
  chamadas: 4,
  sistemas: [
    { nome: 'ERP Enterprise', chamadas: 1 },
    { nome: 'PDV Touch', chamadas: 1 },
    { nome: 'WMS Logística', chamadas: 2 }
  ],
  publicadoEm: '2026-10-01T00:00:00.000Z',
  ...overrides
})

describe('normalização pública do escopo', () => {
  it('normaliza o nome do sistema e ignora valores não textuais', () => {
    expect(normalizarSistema('  WMS Logística  ')).toBe('WMS Logística')
    expect(normalizarSistema('')).toBe('')
    expect(normalizarSistema(null)).toBe('')
    expect(normalizarSistema(42)).toBe('')
  })

  it('normaliza página e tamanho da página', () => {
    expect(normalizarPagina('2')).toBe(2)
    expect(normalizarPagina('abc')).toBe(1)
    expect(normalizarPagina('0')).toBe(1)
    expect(normalizarPorPagina('999')).toBe(50)
    expect(normalizarPorPagina('abc')).toBe(6)
  })
})

describe('seleção de sistema do escopo', () => {
  it('aceita vazio como todos e compara o nome exato', () => {
    const item = escopo()
    expect(sistemaPertenceAoEscopo(item, '')).toBe(true)
    expect(sistemaPertenceAoEscopo(item, 'ERP Enterprise')).toBe(true)
    expect(sistemaPertenceAoEscopo(item, 'ERP')).toBe(false)
  })

  it('resume as contagens do projeto e do sistema', () => {
    const resumo = resumirEscopo(escopo(), 'WMS Logística')
    expect(resumo).toEqual({
      chamadasProjeto: 4,
      totalSistemas: 3,
      chamadasSistema: 2,
      sistemaSelecionado: 'WMS Logística',
      sistemaValido: true
    })
  })

  it('trata sistema desconhecido com zero chamadas e mantém o nome informado', () => {
    const resumo = resumirEscopo(escopo(), 'Sistema Fantasma')
    expect(resumo.chamadasSistema).toBe(0)
    expect(resumo.sistemaValido).toBe(false)
    expect(resumo.sistemaSelecionado).toBe('Sistema Fantasma')
  })

  it('sem sistema, mantém as contagens do projeto e não seleciona sistema', () => {
    const resumo = resumirEscopo(escopo(), null)
    expect(resumo.chamadasSistema).toBe(0)
    expect(resumo.sistemaSelecionado).toBe('')
    expect(resumo.sistemaValido).toBe(true)
  })
})

describe('rótulos públicos do escopo', () => {
  it('usa singular e plural', () => {
    expect(rotuloChamadas(1)).toBe('1 chamada')
    expect(rotuloChamadas(4)).toBe('4 chamadas')
    expect(rotuloSistemas(1)).toBe('1 sistema')
    expect(rotuloSistemas(5)).toBe('5 sistemas')
    expect(rotuloEvidencias(1)).toBe('1 evidência')
    expect(rotuloEvidencias(3)).toBe('3 evidências')
    expect(rotuloImpacto('Alto')).toBe('Impacto: Alto')
    expect(rotuloImpacto('Crítico')).toBe('Impacto: Crítico')
    expect(varianteImpacto('Crítico')).toBe('critico')
    expect(varianteImpacto('Alto')).toBe('neutral')
    expect(varianteImpacto('Baixo')).toBe('neutral')
  })
})
