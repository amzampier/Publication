import { describe, expect, it } from 'vitest'
import {
  agruparManuais,
  agruparReleases,
  contarChamadasSistemas,
  contarSistemas,
  ordenarEscopos,
  rotuloChamadas,
  rotuloManuais,
  rotuloSistemas
} from '../shared/publico'
import type {
  PublicoEscopoResumo,
  PublicoManualResumo,
  PublicoReleaseResumo
} from '../shared/publico'

const release = (overrides: Partial<PublicoReleaseResumo> = {}): PublicoReleaseResumo => ({
  id: 'release-1',
  ano: 2026,
  mes: 'Setembro',
  semana: 39,
  versao: '26.06a',
  release: '26.06a10.05a',
  destaqueSemana: false,
  chamadas: 4,
  publicadoEm: '2026-09-28T00:00:00.000Z',
  ...overrides
})

const manual = (overrides: Partial<PublicoManualResumo> = {}): PublicoManualResumo => ({
  id: 'manual-1',
  ano: 2026,
  mes: 'Setembro',
  mesNumero: 9,
  titulo: 'Manual de Setembro',
  publicadoEm: '2026-09-01T00:00:00.000Z',
  ...overrides
})

const escopo = (overrides: Partial<PublicoEscopoResumo> = {}): PublicoEscopoResumo => ({
  id: 'escopo-1',
  codigo: 'PE-2026.01',
  nome: 'Escopo de Projeto Anual 2026',
  versao: 'v2026.1',
  ano: 2026,
  chamadas: 4,
  sistemas: [
    { nome: 'WMS Logística', chamadas: 1 },
    { nome: 'ERP Enterprise', chamadas: 1 }
  ],
  publicadoEm: '2026-10-01T00:00:00.000Z',
  ...overrides
})

describe('agrupamento público de Releases Week', () => {
  it('agrupa por ano e mês e ordena semanas de forma decrescente', () => {
    const anos = agruparReleases([
      release({ id: 'r37', semana: 37, versao: '26.04a' }),
      release({ id: 'r39', semana: 39, versao: '26.06a', destaqueSemana: true }),
      release({ id: 'r38', semana: 38, versao: '26.05b' }),
      release({ id: 'r30', mes: 'Agosto', semana: 30, versao: '26.03a' }),
      release({ id: 'r52', ano: 2025, mes: 'Dezembro', semana: 52, versao: '25.12a' })
    ])

    expect(anos.map((ano) => ano.ano)).toEqual([2026, 2025])
    expect(anos[0]?.meses.map((mes) => mes.mes)).toEqual(['Setembro', 'Agosto'])
    expect(anos[0]?.meses[0]?.releases.map((item) => item.semana)).toEqual([39, 38, 37])
    expect(anos[0]?.meses[0]?.releases[0]?.destaqueSemana).toBe(true)
    expect(anos[1]?.meses[0]?.mes).toBe('Dezembro')
  })

  it('lida com lista vazia', () => {
    expect(agruparReleases([])).toEqual([])
  })
})

describe('agrupamento público de Manuais Mensais', () => {
  it('conta manuais por mês e mantém anos/meses em ordem decrescente', () => {
    const anos = agruparManuais([
      manual({ id: 'm1', titulo: 'Manual A' }),
      manual({ id: 'm2', titulo: 'Manual B' }),
      manual({ id: 'm3', mes: 'Agosto', mesNumero: 8, titulo: 'Manual de Agosto' }),
      manual({ id: 'm4', ano: 2025, mes: 'Dezembro', mesNumero: 12, titulo: 'Manual de Dezembro' })
    ])

    expect(anos.map((ano) => ano.ano)).toEqual([2026, 2025])
    expect(anos[0]?.meses.map((mes) => mes.mes)).toEqual(['Setembro', 'Agosto'])
    expect(anos[0]?.meses[0]?.manuais).toHaveLength(2)
    expect(anos[0]?.meses[1]?.manuais).toHaveLength(1)
    expect(anos[1]?.meses[0]?.manuais).toHaveLength(1)
  })

  it('usa a ordem de MESES quando mesNumero vier ausente ou inválido', () => {
    const anos = agruparManuais([
      manual({ id: 'm1', mes: 'Janeiro', mesNumero: 0 }),
      manual({ id: 'm2', mes: 'Março', mesNumero: 0 })
    ])

    expect(anos[0]?.meses.map((mes) => mes.mes)).toEqual(['Março', 'Janeiro'])
  })

  it('lida com lista vazia', () => {
    expect(agruparManuais([])).toEqual([])
  })
})

describe('ordenação pública de Escopo de Projetos', () => {
  it('ordena por ano, nome e versão e mantém sistemas alfabéticos', () => {
    const escopos = ordenarEscopos([
      escopo({ id: 'b', nome: 'Beta', ano: 2026 }),
      escopo({ id: 'a', nome: 'Alfa', ano: 2026 }),
      escopo({ id: 'z', nome: 'Zeta', ano: 2025 }),
      escopo({
        id: 'c',
        nome: 'Alfa',
        versao: 'v2026.0',
        sistemas: [
          { nome: 'Zebra', chamadas: 1 },
          { nome: 'Alpha', chamadas: 2 }
        ]
      })
    ])

    expect(escopos.map((item) => item.id)).toEqual(['a', 'c', 'b', 'z'])
    expect(escopos[0]?.sistemas.map((sistema) => sistema.nome)).toEqual([
      'ERP Enterprise',
      'WMS Logística'
    ])
    expect(escopos[1]?.sistemas.map((sistema) => sistema.nome)).toEqual(['Alpha', 'Zebra'])
  })

  it('conta sistemas e chamadas agregadas', () => {
    const item = escopo()
    expect(contarSistemas(item)).toBe(2)
    expect(contarChamadasSistemas(item)).toBe(2)
  })
})

describe('rótulos públicos', () => {
  it('singular e plural', () => {
    expect(rotuloChamadas(1)).toBe('1 chamada')
    expect(rotuloChamadas(4)).toBe('4 chamadas')
    expect(rotuloManuais(1)).toBe('1 manual')
    expect(rotuloManuais(2)).toBe('2 manuais')
    expect(rotuloSistemas(1)).toBe('1 sistema')
    expect(rotuloSistemas(5)).toBe('5 sistemas')
  })
})
