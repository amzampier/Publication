import { describe, expect, it } from 'vitest'
import {
  contarTipos,
  filtrarHistorico,
  limitarChamadasCriticas,
  normalizarPagina,
  normalizarPorPagina,
  normalizarSoftware,
  normalizarTipo,
  ranquearMaisVistas,
  rotuloFotos,
  rotuloTipo,
  rotuloVisualizacoes,
  selecionarEscopoDestaque,
  selecionarItensDestaque,
  selecionarManuaisDestaque,
  selecionarReleaseDestaque,
  varianteTipoItem
} from '../shared/publico'
import type {
  PublicoChamadaCritica,
  PublicoEscopoResumo,
  PublicoManualDestaqueResumo,
  PublicoManualItemDestaque,
  PublicoReleaseDestaque,
  PublicoReleaseFiltravel,
  PublicoReleaseResumoPainel
} from '../shared/publico'

const releaseDestaque = (
  overrides: Partial<PublicoReleaseDestaque> = {}
): PublicoReleaseDestaque => ({
  id: 'release-1',
  semana: 39,
  ano: 2026,
  mes: 'Setembro',
  versao: '26.06a',
  release: '26.06a10.05a',
  nome: 'Release Week 39',
  descricao: 'Descrição da release',
  publicadoEm: '2026-09-28T00:00:00.000Z',
  totalVisualizacoes: 0,
  destaqueSemana: false,
  revisorNome: '',
  chamadas: [],
  ...overrides
})

const resumo = (
  overrides: Partial<PublicoReleaseResumoPainel> = {}
): PublicoReleaseResumoPainel => ({
  id: 'release-1',
  semana: 39,
  ano: 2026,
  versao: '26.06a',
  release: '26.06a10.05a',
  nome: 'Release Week 39',
  descricao: 'Descrição da release',
  chamadas: 2,
  contagens: { correcao: 1, melhoria: 1, nova: 0 },
  publicadoEm: '2026-09-28T00:00:00.000Z',
  totalVisualizacoes: 0,
  ...overrides
})

const manual = (
  overrides: Partial<PublicoManualDestaqueResumo> = {}
): PublicoManualDestaqueResumo => ({
  id: 'manual-1',
  ano: 2026,
  mes: 'Setembro',
  mesNumero: 9,
  titulo: 'Manual de Setembro',
  descricao: 'Descrição do manual',
  destaqueSemana: true,
  publicadoEm: '2026-09-01T00:00:00.000Z',
  ...overrides
})

const itemManual = (
  overrides: Partial<PublicoManualItemDestaque> = {}
): PublicoManualItemDestaque => ({
  card: 'item',
  id: 'item-1',
  manualId: 'manual-1',
  titulo: 'Guia do item',
  descricao: 'Descrição do item',
  software: 'ERP Enterprise',
  modulo: 'Fiscal',
  tipo: 'Correção',
  mes: 'Setembro',
  ano: 2026,
  linkVideo: '',
  linkManual: '',
  publicadoEm: '2026-09-02T00:00:00.000Z',
  ...overrides
})

const filtravel = (
  overrides: Partial<PublicoReleaseFiltravel> = {}
): PublicoReleaseFiltravel => ({
  ...resumo(),
  softwares: ['ERP Enterprise'],
  ...overrides
})

const escopo = (
  overrides: Partial<PublicoEscopoResumo> = {}
): PublicoEscopoResumo => ({
  id: 'escopo-1',
  codigo: 'ESC-2026-1',
  nome: 'Projeto 26.06a',
  versao: '26.06a',
  ano: 2026,
  chamadas: 4,
  sistemas: [{ nome: 'ERP Enterprise', chamadas: 3 }],
  publicadoEm: '2026-10-29T00:00:00.000Z',
  ...overrides
})

const critica = (
  overrides: Partial<PublicoChamadaCritica> = {}
): PublicoChamadaCritica => ({
  id: 'critica-1',
  chamada: 'CH-1',
  titulo: 'Falha crítica no cálculo',
  softwares: ['ERP Enterprise'],
  parceiro: 'Parceiro X',
  tipo: 'Correção',
  impacto: 'Crítico',
  ...overrides
})

describe('seleção do painel público', () => {
  it('prioriza a release em destaque e usa a mais recente como fallback', () => {
    const comDestaque = selecionarReleaseDestaque([
      releaseDestaque({
        id: 'r38',
        publicadoEm: '2026-09-21T00:00:00.000Z'
      }),
      releaseDestaque({
        id: 'r39',
        destaqueSemana: true,
        publicadoEm: '2026-09-28T00:00:00.000Z'
      })
    ])

    expect(comDestaque.release?.id).toBe('r39')
    expect(comDestaque.rotulo).toBe('Última Release Liberada da Semana')

    const semDestaque = selecionarReleaseDestaque([
      releaseDestaque({ id: 'r38', publicadoEm: '2026-09-21T00:00:00.000Z' }),
      releaseDestaque({ id: 'r37', publicadoEm: '2026-09-14T00:00:00.000Z' })
    ])

    expect(semDestaque.release?.id).toBe('r38')
    expect(semDestaque.rotulo).toBe('Última Release Publicada')
    expect(selecionarReleaseDestaque([]).release).toBeNull()
  })

  it('ordena as chamadas por ordem de apresentação e limita o hero a três', () => {
    const itens = selecionarItensDestaque([
      { id: 'c', chamada: '3', ordemApresentacao: 3 },
      { id: 'a', chamada: '1', ordemApresentacao: 1 },
      { id: 'b', chamada: '2', ordemApresentacao: 2 },
      { id: 'd', chamada: '4', ordemApresentacao: 4 }
    ])

    expect(itens.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('seleciona um item por manual, prioriza links e usa catálogo como fallback', () => {
    const manuais = [
      manual({ id: 'm1', publicadoEm: '2026-09-01T00:00:00.000Z' }),
      manual({ id: 'm2', publicadoEm: '2026-08-01T00:00:00.000Z' }),
      manual({ id: 'm3', publicadoEm: '2026-07-01T00:00:00.000Z' })
    ]
    const itens = [
      itemManual({ id: 'm1-a', manualId: 'm1' }),
      itemManual({
        id: 'm1-b',
        manualId: 'm1',
        linkVideo: 'https://video.example/guia'
      }),
      itemManual({ id: 'm2-a', manualId: 'm2' })
    ]

    const selecionados = selecionarManuaisDestaque(manuais, itens)
    expect(selecionados).toHaveLength(2)
    expect(selecionados[0]?.id).toBe('m1-b')
    expect(selecionados[1]?.id).toBe('m2-a')
    expect(selecionados.every((item) => item.card === 'item')).toBe(true)

    const catalogo = selecionarManuaisDestaque(
      [manual({ id: 'm4', titulo: 'Catálogo de Outubro' })],
      []
    )
    expect(catalogo[0]?.card).toBe('catalogo')
    expect(catalogo[0]?.titulo).toBe('Catálogo de Outubro')
    expect(catalogo[0]?.id).toBe('m4')
  })

  it('exclui o hero e ordena por visualizações, completando com recentes', () => {
    const ranking = ranquearMaisVistas(
      [
        resumo({ id: 'hero', totalVisualizacoes: 9999 }),
        resumo({
          id: 'r37',
          totalVisualizacoes: 3108,
          publicadoEm: '2026-09-14T00:00:00.000Z'
        }),
        resumo({
          id: 'r38',
          totalVisualizacoes: 2183,
          publicadoEm: '2026-09-21T00:00:00.000Z'
        }),
        resumo({
          id: 'r36',
          totalVisualizacoes: 1850,
          publicadoEm: '2026-09-07T00:00:00.000Z'
        })
      ],
      'hero'
    )

    expect(ranking.modo).toBe('vistas')
    expect(ranking.itens.map((item) => item.id)).toEqual(['r37', 'r38', 'r36'])

    const parcial = ranquearMaisVistas(
      [
        resumo({
          id: 'a',
          totalVisualizacoes: 10,
          publicadoEm: '2026-09-01T00:00:00.000Z'
        }),
        resumo({
          id: 'b',
          totalVisualizacoes: 0,
          publicadoEm: '2026-09-02T00:00:00.000Z'
        }),
        resumo({
          id: 'c',
          totalVisualizacoes: 0,
          publicadoEm: '2026-09-03T00:00:00.000Z'
        })
      ],
      null
    )

    expect(parcial.modo).toBe('vistas')
    expect(parcial.itens.map((item) => item.id)).toEqual(['a', 'c', 'b'])
  })

  it('usa releases recentes quando todas as visualizações são zero', () => {
    const ranking = ranquearMaisVistas(
      [
        resumo({ id: 'a', publicadoEm: '2026-09-01T00:00:00.000Z' }),
        resumo({ id: 'b', publicadoEm: '2026-09-02T00:00:00.000Z' })
      ],
      null
    )

    expect(ranking.modo).toBe('recentes')
    expect(ranking.itens.map((item) => item.id)).toEqual(['b', 'a'])
  })
})

describe('contagens, filtros e normalização do painel', () => {
  it('conta os tipos publicados', () => {
    expect(
      contarTipos([
        { tipo: 'Correção' },
        { tipo: 'Correção' },
        { tipo: 'Melhoria' },
        { tipo: 'Nova Funcionalidade' },
        { tipo: 'Outro' }
      ])
    ).toEqual({ correcao: 2, melhoria: 1, nova: 1 })
  })

  it('filtra o histórico por software e tipo com E lógico', () => {
    const releases = [
      filtravel({
        id: 'a',
        softwares: ['ERP Enterprise'],
        contagens: { correcao: 1, melhoria: 0, nova: 0 }
      }),
      filtravel({
        id: 'b',
        softwares: ['PDV Touch'],
        contagens: { correcao: 0, melhoria: 1, nova: 0 }
      }),
      filtravel({
        id: 'c',
        softwares: ['ERP Enterprise', 'PDV Touch'],
        contagens: { correcao: 0, melhoria: 0, nova: 1 }
      })
    ]

    expect(filtrarHistorico(releases, { software: 'ERP Enterprise' }).map((item) => item.id)).toEqual([
      'a',
      'c'
    ])
    expect(filtrarHistorico(releases, { tipo: 'Melhoria' }).map((item) => item.id)).toEqual(['b'])
    expect(
      filtrarHistorico(releases, {
        software: 'ERP Enterprise',
        tipo: 'Nova Funcionalidade'
      }).map((item) => item.id)
    ).toEqual(['c'])
  })

  it('normaliza página, tamanho da página, tipo e software', () => {
    expect(normalizarPagina(undefined)).toBe(1)
    expect(normalizarPagina('0')).toBe(1)
    expect(normalizarPagina('2')).toBe(2)
    expect(normalizarPorPagina(undefined)).toBe(6)
    expect(normalizarPorPagina('999')).toBe(50)
    expect(normalizarPorPagina('0')).toBe(6)
    expect(normalizarTipo('Correção')).toBe('Correção')
    expect(normalizarTipo('Outro')).toBe('')
    expect(normalizarSoftware('  ERP Enterprise  ')).toBe('ERP Enterprise')
    expect(normalizarSoftware(null)).toBe('')
  })

  it('formata os rótulos em pt-BR', () => {
    expect(rotuloFotos(1)).toBe('1 foto')
    expect(rotuloFotos(2)).toBe('2 fotos')
    expect(rotuloVisualizacoes(1434)).toBe('1.434 visualizações')
    expect(rotuloVisualizacoes(1)).toBe('1 visualização')
    expect(rotuloTipo('Correção', 2)).toBe('2 correções')
    expect(rotuloTipo('Melhoria', 1)).toBe('1 melhoria')
    expect(rotuloTipo('Nova Funcionalidade', 1)).toBe('1 nova funcionalidade')
  })

  it('mapeia o tipo para a variante de badge', () => {
    expect(varianteTipoItem('Correção')).toBe('correcao')
    expect(varianteTipoItem('Melhoria')).toBe('melhoria')
    expect(varianteTipoItem('Nova Funcionalidade')).toBe('nova')
    expect(varianteTipoItem(null)).toBe('neutral')
  })
})

describe('escopo em destaque e chamadas críticas', () => {
  it('seleciona o escopo com publicação mais recente', () => {
    const selecionado = selecionarEscopoDestaque([
      escopo({ id: 'antigo', publicadoEm: '2026-09-01T00:00:00.000Z' }),
      escopo({ id: 'recente', publicadoEm: '2026-10-29T00:00:00.000Z' })
    ])

    expect(selecionado?.id).toBe('recente')
    expect(selecionarEscopoDestaque([])).toBeNull()
  })

  it('desempata por ano e versão quando a publicação é igual', () => {
    const selecionado = selecionarEscopoDestaque([
      escopo({ id: 'ano-menor', ano: 2025, versao: '26.06a' }),
      escopo({ id: 'versao-menor', ano: 2026, versao: '25.12a' }),
      escopo({ id: 'versao-maior', ano: 2026, versao: '26.06a' })
    ])

    expect(selecionado?.id).toBe('versao-maior')
  })

  it('ordena as críticas por apresentação e chamada, limitando a três', () => {
    const criticas = limitarChamadasCriticas([
      critica({ id: 'c4', chamada: 'CH-4', ordemApresentacao: 4 }),
      critica({ id: 'c1', chamada: 'CH-1', ordemApresentacao: 1 }),
      critica({ id: 'c2b', chamada: 'CH-2B', ordemApresentacao: 2 }),
      critica({ id: 'c2a', chamada: 'CH-2A', ordemApresentacao: 2 }),
      critica({ id: 'c3', chamada: 'CH-3', ordemApresentacao: 3 })
    ])

    expect(criticas.map((item) => item.id)).toEqual(['c1', 'c2a', 'c2b'])
    expect(limitarChamadasCriticas([], 3)).toEqual([])
    expect(limitarChamadasCriticas([critica()], 0)).toEqual([])
  })
})
