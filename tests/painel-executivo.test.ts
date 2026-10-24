import { describe, it, expect } from 'vitest'
import {
  calcularFluxoPainel,
  calcularLeadTimeMedioDias,
  calcularPercentual,
  calcularTaxaRecusa,
  contarChamadasPorVinculo,
  criarPainelVazio,
  criarSerieMensalVazia,
  preencherSerieAnual,
  type ItemFluxoPainel
} from '../shared/painel-executivo'
import {
  calcularProgresso,
  itemNoCicloAtivo,
  type ContextoVinculo,
  type ItemEsteira
} from '../shared/esteira-revisao'
import type { StatusChamada } from '../shared/lancar-chamadas'

const contexto = (
  id: string,
  status = 'Em Andamento',
  arquivada = false
): ContextoVinculo => ({
  id,
  codigo: `CTX-${id}`,
  nome: `Contexto ${id}`,
  status,
  arquivada,
  publicadoEm: '2026-10-01T00:00:00.000Z'
})

const itemFluxo = (
  status: StatusChamada,
  dados: Partial<ItemFluxoPainel['contexto']> = {},
  dataReferencia?: string
): ItemFluxoPainel => ({
  status,
  contexto: {
    release: null,
    manual: null,
    projeto: null,
    ...dados
  },
  dataReferencia,
  publicadoEm: '2026-10-01T00:00:00.000Z'
})

const comoItemEsteira = (item: ItemFluxoPainel): ItemEsteira =>
  item as unknown as ItemEsteira

describe('séries do painel', () => {
  it('cria os 12 meses com zero', () => {
    const serie = criarSerieMensalVazia()
    expect(serie).toHaveLength(12)
    expect(serie.map((ponto) => ponto.rotulo)).toEqual([
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez'
    ])
    expect(serie.every((ponto) => ponto.chamadasLancadas === 0)).toBe(true)
    expect(
      serie.every(
        (ponto) =>
          ponto.releases.aberta === 0 &&
          ponto.releases.emRevisao === 0 &&
          ponto.releases.aprovado === 0 &&
          ponto.releases.publicado === 0
      )
    ).toBe(true)
  })

  it('preenche a série anual de cinco anos com zeros', () => {
    expect(preencherSerieAnual([], 2026)).toEqual([
      { ano: 2022, publicadas: 0 },
      { ano: 2023, publicadas: 0 },
      { ano: 2024, publicadas: 0 },
      { ano: 2025, publicadas: 0 },
      { ano: 2026, publicadas: 0 }
    ])
  })

  it('distribui os anos informados na janela', () => {
    expect(
      preencherSerieAnual(
        [
          { ano: 2026, publicadas: 8 },
          { ano: 2023, publicadas: 4 }
        ],
        2026
      )
    ).toEqual([
      { ano: 2022, publicadas: 0 },
      { ano: 2023, publicadas: 4 },
      { ano: 2024, publicadas: 0 },
      { ano: 2025, publicadas: 0 },
      { ano: 2026, publicadas: 8 }
    ])
  })
})

describe('percentuais e lead time', () => {
  it('não divide por zero', () => {
    expect(calcularPercentual(0, 0)).toBe(0)
    expect(calcularTaxaRecusa(0, 0)).toBe(0)
    expect(calcularTaxaRecusa(1, 0)).toBe(0)
    expect(calcularPercentual(1, 4)).toBe(25)
    expect(calcularTaxaRecusa(3, 4)).toBe(75)
  })

  it('calcula o lead time apenas das chamadas liberadas até hoje', () => {
    expect(
      calcularLeadTimeMedioDias(
        [
          { dataLancamento: '2026-10-01', dataLiberacao: '2026-10-11' },
          { dataLancamento: '2026-09-20', dataLiberacao: '2026-10-10' },
          { dataLancamento: '2026-10-20', dataLiberacao: '2026-11-10' },
          { dataLancamento: '2026-10-20', dataLiberacao: '2026-10-19' }
        ],
        '2026-10-22'
      )
    ).toBe(15)
  })

  it('retorna zero sem chamadas liberadas', () => {
    expect(calcularLeadTimeMedioDias([], '2026-10-22')).toBe(0)
    expect(
      calcularLeadTimeMedioDias(
        [{ dataLancamento: '2026-10-20', dataLiberacao: '2026-11-10' }],
        '2026-10-22'
      )
    ).toBe(0)
  })
})

describe('contagem por vínculo', () => {
  it('conta a mesma chamada em cada vínculo (origem Ambos)', () => {
    const totais = contarChamadasPorVinculo([
      { releaseId: 'r1', manualId: 'm1' },
      { releaseId: 'r2' },
      { manualId: 'm2' },
      { projetoId: 'p1' }
    ])
    expect(totais).toEqual({ release: 2, manual: 2, projeto: 1 })
    expect(totais.release + totais.manual + totais.projeto).toBeGreaterThan(4)
  })
})

describe('fluxo da esteira', () => {
  const itens: ItemFluxoPainel[] = [
    itemFluxo('Revisar', { release: contexto('r1') }, '2026-10-12'),
    itemFluxo('Revisar', { release: contexto('r2') }, '2026-10-01'),
    itemFluxo('Aprovado', { release: contexto('r3') }),
    itemFluxo('Recusado', { release: contexto('r4') }),
    itemFluxo('Publicar', { release: contexto('r5') }),
    itemFluxo('Publicado', { release: contexto('r6', 'Publicado') }),
    itemFluxo('Revisar', { release: contexto('r7', 'Em Andamento', true) })
  ]

  it('usa as mesmas regras da Esteira para o ciclo ativo', () => {
    const fluxo = calcularFluxoPainel(itens, '2026-10-22')
    const noCiclo = itens.filter(itemNoCicloAtivo).map(comoItemEsteira)
    const progresso = calcularProgresso(noCiclo)

    expect(fluxo.total).toBe(progresso.total + fluxo.noPortal)
    expect(fluxo.percentualFluxo).toBe(Math.round(((progresso.aprovado + progresso.publicar + fluxo.noPortal) / fluxo.total) * 100))
    expect(fluxo.aprovado).toBe(progresso.aprovado)
    expect(fluxo.publicar).toBe(progresso.publicar)
    expect(fluxo.recusado).toBe(progresso.recusado)
  })

  it('separa publicados no portal, aguardando pai e aging', () => {
    const fluxo = calcularFluxoPainel(itens, '2026-10-22')
    expect(fluxo.revisar).toBe(2)
    expect(fluxo.aprovado).toBe(1)
    expect(fluxo.recusado).toBe(1)
    expect(fluxo.publicar).toBe(1)
    expect(fluxo.aguardandoPai).toBe(1)
    expect(fluxo.noPortal).toBe(1)
    expect(fluxo.total).toBe(6)
    expect(fluxo.aging7).toBe(2)
    expect(fluxo.aging15).toBe(1)
    expect(fluxo.percentualFluxo).toBe(50)
  })

  it('não divide por zero sem chamadas no ciclo', () => {
    const fluxo = calcularFluxoPainel([], '2026-10-22')
    expect(fluxo.total).toBe(0)
    expect(fluxo.percentualFluxo).toBe(0)
    expect(fluxo.aging7).toBe(0)
    expect(fluxo.aging15).toBe(0)
  })
})

describe('painel vazio', () => {
  it('monta o contrato completo com zeros', () => {
    const painel = criarPainelVazio(2026, '2026-10-22')
    expect(painel.periodo.ano).toBe(2026)
    expect(painel.periodo.inicio).toBe('2026-01-01')
    expect(painel.periodo.fim).toBe('2026-12-31')
    expect(painel.kpis.releasesPublicadas).toBe(0)
    expect(painel.serieMensal).toHaveLength(12)
    expect(painel.serieAnual).toHaveLength(5)
    expect(painel.porPublicacao).toEqual({ releases: [], manuais: [], escopos: [] })
    expect(painel.anosDisponiveis).toEqual([2026])
  })
})
