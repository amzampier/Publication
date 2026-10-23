import { describe, it, expect } from 'vitest'
import {
  buscarChamadas,
  calcularKpis,
  derivarOrigem,
  ehSegundaFeira,
  filtrarChamadas,
  formatarData,
  formatarNumero,
  normalizarImagensChamada,
  normalizarTagsChamada,
  motivoBloqueioAprovacao,
  motivoBloqueioDesaprovacao,
  motivoBloqueioExclusao,
  motivoBloqueioRecusa,
  podeAprovar,
  podeDesaprovar,
  podeExcluir,
  podeRecusar,
  proximaSegunda,
  validarChamada,
  type ChamadaModelo,
  type EntradaChamada,
  type FiltrosChamada
} from '../shared/lancar-chamadas'

const chamadaBase = (over: Partial<ChamadaModelo> = {}): ChamadaModelo => ({
  id: 'ch-1',
  origem: 'Release',
  releaseId: 'rw-1',
  projetoId: '',
  manualId: '',
  softwareIds: ['SFT-001'],
  parceiroId: 'par-1',
  autorId: 'user-1',
  autorNome: 'Ana Carolina Ribeiro',
  chamada: 'CH-2026-8941',
  dataLancamento: '2026-10-19',
  dataLiberacao: '2026-10-26',
  release: 'RW-43/2026',
  titulo: 'Ajuste no cálculo de impostos',
  parceiro: 'Grupo Andrade',
  softwares: ['Teorema ERP'],
  modulo: 'Fiscal',
  menuFuncionalidade: 'Notas fiscais',
  tipo: 'Correção',
  impacto: 'Médio',
  descricaoCompleta: 'Correção do cálculo de impostos na emissão da nota.',
  descricaoHtml: '',
  solucao: '',
  solucaoHtml: '',
  manualTitulo: '',
  linkManual: '',
  linkVideo: '',
  imagens: [],
  status: 'Revisar',
  tags: ['fiscal'],
  temHistorico: false,
  criadoEm: '2026-10-19T10:00:00.000Z',
  atualizadoEm: '2026-10-19T10:00:00.000Z',
  ...over
})

const entradaValida = (over: Partial<EntradaChamada> = {}): EntradaChamada => ({
  chamada: 'CH-2026-8941',
  titulo: 'Ajuste no cálculo de impostos',
  dataLancamento: '2026-10-19',
  dataLiberacao: '2026-10-26',
  releaseId: 'rw-1',
  projetoId: '',
  manualId: '',
  softwareIds: ['SFT-001'],
  parceiroId: 'par-1',
  modulo: 'Fiscal',
  menuFuncionalidade: 'Notas fiscais',
  tipo: 'Correção',
  impacto: 'Médio',
  descricaoCompleta: 'Correção do cálculo de impostos na emissão da nota.',
  descricaoHtml: '',
  solucao: '',
  solucaoHtml: '',
  linkManual: 'https://exemplo.com/manual',
  linkVideo: '',
  imagens: [],
  tags: ['fiscal'],
  ...over
})

describe('validarChamada', () => {
  it('aceita a chamada completa', () => {
    const resultado = validarChamada(entradaValida())
    expect(resultado.valido).toBe(true)
    expect(resultado.primeiroErro).toBeNull()
  })

  it('exige os campos obrigatórios na ordem definida', () => {
    const resultado = validarChamada({})
    expect(resultado.valido).toBe(false)
    expect(resultado.erros.chamada).toBeTruthy()
    expect(resultado.erros.titulo).toBeTruthy()
    expect(resultado.erros.vinculo).toBeTruthy()
    expect(resultado.erros.softwareIds).toBeTruthy()
    expect(resultado.erros.parceiroId).toBeTruthy()
    expect(resultado.erros.modulo).toBeTruthy()
    expect(resultado.erros.descricaoCompleta).toBeTruthy()
    expect(resultado.erros.dataLancamento).toBeTruthy()
    expect(resultado.primeiroErro).toBe('chamada')
  })

  it('recusa chamada duplicada, exceto o próprio registro', () => {
    const existente = chamadaBase()
    const entrada = entradaValida({ chamada: ' ch-2026-8941 ' })
    expect(validarChamada(entrada, [existente]).erros.chamada).toMatch(/já existe/i)
    expect(validarChamada(entrada, [existente], 'ch-1').valido).toBe(true)
  })

  it('exige ao menos um vínculo', () => {
    const resultado = validarChamada(
      entradaValida({ releaseId: '', projetoId: '', manualId: '' })
    )
    expect(resultado.erros.vinculo).toBeTruthy()
    expect(resultado.primeiroErro).toBe('vinculo')
  })

  it('aceita Release, Projeto, Manual e combinações', () => {
    expect(
      validarChamada(entradaValida({ releaseId: 'rw-1', projetoId: '', manualId: '' })).valido
    ).toBe(true)
    expect(
      validarChamada(entradaValida({ releaseId: '', projetoId: 'pe-1', manualId: '' })).valido
    ).toBe(true)
    expect(
      validarChamada(entradaValida({ releaseId: '', projetoId: '', manualId: 'man-1' })).valido
    ).toBe(true)
    expect(
      validarChamada(
        entradaValida({ releaseId: 'rw-1', projetoId: 'pe-1', manualId: 'man-1' })
      ).valido
    ).toBe(true)
  })

  it('aceita data de lançamento em qualquer dia', () => {
    expect(validarChamada(entradaValida({ dataLancamento: '2026-10-20' })).valido).toBe(true)
    expect(validarChamada(entradaValida({ dataLancamento: '2026-10-21' })).valido).toBe(true)
  })

  it('aceita data de liberação em qualquer dia e aceita vazia', () => {
    expect(validarChamada(entradaValida({ dataLiberacao: '2026-10-21' })).valido).toBe(true)
    expect(validarChamada(entradaValida({ dataLiberacao: '' })).valido).toBe(true)
  })

  it('recusa links que não sejam http(s)', () => {
    const resultado = validarChamada(
      entradaValida({ linkManual: 'www.exemplo.com', linkVideo: 'ftp://exemplo.com' })
    )
    expect(resultado.erros.linkManual).toBeTruthy()
    expect(resultado.erros.linkVideo).toBeTruthy()
  })

  it('limita a quantidade e o tamanho das tags', () => {
    const muitas = validarChamada(
      entradaValida({ tags: Array.from({ length: 13 }, (_, i) => `tag-${i}`) })
    )
    expect(muitas.erros.tags).toMatch(/12/)
    const longa = validarChamada(entradaValida({ tags: ['a'.repeat(31)] }))
    expect(longa.erros.tags).toMatch(/30/)
  })

  it('normaliza tags e imagens antes de validar', () => {
    expect(normalizarTagsChamada([' Fiscal ', 'fiscal', '', 'NF-e'])).toEqual(['Fiscal', 'NF-e'])
    expect(normalizarImagensChamada([' /uploads/chamadas/2026/10/a.png ', '/uploads/chamadas/2026/10/a.png'])).toEqual([
      '/uploads/chamadas/2026/10/a.png'
    ])
    const imagens = Array.from({ length: 21 }, (_, i) => `/uploads/chamadas/2026/10/${i}.png`)
    expect(validarChamada(entradaValida({ imagens })).erros.imagens).toMatch(/20/)
  })

  it('exige a Descrição completa e aceita a Solução vazia', () => {
    const semDescricao = validarChamada(entradaValida({ descricaoCompleta: '   ' }))
    expect(semDescricao.erros.descricaoCompleta).toBeTruthy()
    expect(semDescricao.primeiroErro).toBe('descricaoCompleta')
    expect(validarChamada(entradaValida({ solucao: '' })).valido).toBe(true)
    expect(validarChamada(entradaValida({ solucao: 'Aplicado o ajuste.' })).valido).toBe(true)
  })

  it('limita o tamanho da Descrição e da Solução em texto puro', () => {
    const longa = 'a'.repeat(20001)
    expect(validarChamada(entradaValida({ descricaoCompleta: longa })).erros.descricaoCompleta).toMatch(
      /20000/
    )
    expect(validarChamada(entradaValida({ solucao: longa })).erros.solucao).toMatch(/20000/)
  })
})

describe('derivarOrigem', () => {
  it('deriva a origem de um único vínculo', () => {
    expect(derivarOrigem({ releaseId: 'rw-1' })).toBe('Release')
    expect(derivarOrigem({ projetoId: 'pe-1' })).toBe('Projeto')
    expect(derivarOrigem({ manualId: 'man-1' })).toBe('Manual')
  })

  it('combina dois ou três vínculos em Ambos', () => {
    expect(derivarOrigem({ releaseId: 'rw-1', projetoId: 'pe-1' })).toBe('Ambos')
    expect(derivarOrigem({ projetoId: 'pe-1', manualId: 'man-1' })).toBe('Ambos')
    expect(derivarOrigem({ releaseId: 'rw-1', projetoId: 'pe-1', manualId: 'man-1' })).toBe(
      'Ambos'
    )
  })

  it('retorna null sem vínculo', () => {
    expect(derivarOrigem({})).toBeNull()
    expect(derivarOrigem({ releaseId: '', projetoId: '', manualId: '' })).toBeNull()
  })
})

describe('datas', () => {
  it('identifica segunda-feira sem deslocamento de fuso', () => {
    expect(ehSegundaFeira('2026-10-19')).toBe(true)
    expect(ehSegundaFeira('2026-10-20')).toBe(false)
    expect(ehSegundaFeira('data-invalida')).toBe(false)
  })

  it('calcula a próxima segunda-feira, inclusive quando já é segunda', () => {
    expect(proximaSegunda(new Date(2026, 9, 21))).toBe('2026-10-26')
    expect(proximaSegunda(new Date(2026, 9, 19))).toBe('2026-10-19')
  })

  it('formata data e número em pt-BR', () => {
    expect(formatarData('2026-10-19')).toBe('19/10/2026')
    expect(formatarData('')).toBe('—')
    expect(formatarNumero(1280)).toBe('1.280')
  })
})

describe('filtrarChamadas, buscarChamadas e KPIs', () => {
  const chamadas = [
    chamadaBase({
      id: 'a',
      chamada: 'A-1',
      status: 'Revisar',
      tipo: 'Correção',
      impacto: 'Baixo',
      softwareIds: ['SFT-001'],
      parceiroId: 'par-1',
      origem: 'Release',
      dataLancamento: '2026-10-19',
      tags: ['fiscal']
    }),
    chamadaBase({
      id: 'b',
      chamada: 'B-2',
      status: 'Aprovado',
      tipo: 'Melhoria',
      impacto: 'Alto',
      softwareIds: ['SFT-002'],
      parceiroId: 'par-2',
      origem: 'Projeto',
      releaseId: '',
      release: '',
      projetoId: 'pe-1',
      dataLancamento: '2026-10-12',
      dataLiberacao: '2026-10-19',
      titulo: 'Melhoria no portal',
      tags: ['portal']
    }),
    chamadaBase({
      id: 'c',
      chamada: 'C-3',
      status: 'Publicar',
      tipo: 'Nova Funcionalidade',
      impacto: 'Crítico',
      softwareIds: ['SFT-003'],
      parceiroId: 'par-1',
      origem: 'Manual',
      releaseId: '',
      release: '',
      manualId: 'man-1',
      dataLancamento: '2026-10-05',
      dataLiberacao: '2026-10-12',
      titulo: 'Nova rotina de estoque',
      tags: ['estoque']
    })
  ]

  const semFiltro: FiltrosChamada = {
    status: '',
    tipo: '',
    impacto: '',
    softwareIds: [],
    parceiroId: '',
    origem: '',
    dataLancamentoDe: '',
    dataLancamentoAte: '',
    dataLiberacaoDe: '',
    dataLiberacaoAte: ''
  }

  it('ordena por chamada crescente com comparação numérica', () => {
    expect(filtrarChamadas(chamadas, semFiltro).map((c) => c.id)).toEqual(['a', 'b', 'c'])
    const foraDeOrdem = [
      chamadaBase({ id: 'z', chamada: 'CH-10' }),
      chamadaBase({ id: 'y', chamada: 'CH-2' })
    ]
    expect(filtrarChamadas(foraDeOrdem, semFiltro).map((c) => c.chamada)).toEqual(['CH-2', 'CH-10'])
  })

  it('aplica cada filtro', () => {
    expect(filtrarChamadas(chamadas, { ...semFiltro, status: 'Aprovado' }).map((c) => c.id)).toEqual([
      'b'
    ])
    expect(filtrarChamadas(chamadas, { ...semFiltro, tipo: 'Melhoria' }).map((c) => c.id)).toEqual([
      'b'
    ])
    expect(filtrarChamadas(chamadas, { ...semFiltro, impacto: 'Crítico' }).map((c) => c.id)).toEqual([
      'c'
    ])
    expect(
      filtrarChamadas(chamadas, { ...semFiltro, softwareIds: ['SFT-002'] }).map((c) => c.id)
    ).toEqual(['b'])
    expect(
      filtrarChamadas(chamadas, { ...semFiltro, parceiroId: 'par-1' }).map((c) => c.id)
    ).toEqual(['a', 'c'])
    expect(filtrarChamadas(chamadas, { ...semFiltro, origem: 'Projeto' }).map((c) => c.id)).toEqual([
      'b'
    ])
  })

  it('filtra por períodos de lançamento e liberação', () => {
    expect(
      filtrarChamadas(chamadas, {
        ...semFiltro,
        dataLancamentoDe: '2026-10-12'
      }).map((c) => c.id)
    ).toEqual(['a', 'b'])
    expect(
      filtrarChamadas(chamadas, {
        ...semFiltro,
        dataLancamentoAte: '2026-10-12'
      }).map((c) => c.id)
    ).toEqual(['b', 'c'])
    expect(
      filtrarChamadas(chamadas, {
        ...semFiltro,
        dataLiberacaoDe: '2026-10-20'
      }).map((c) => c.id)
    ).toEqual(['a'])
    expect(
      filtrarChamadas(chamadas, {
        ...semFiltro,
        dataLiberacaoAte: '2026-10-15'
      }).map((c) => c.id)
    ).toEqual(['c'])
  })

  it('busca por chamada, título, tag e release', () => {
    expect(buscarChamadas(chamadas, 'B-2').map((c) => c.id)).toEqual(['b'])
    expect(buscarChamadas(chamadas, 'estoque').map((c) => c.id)).toEqual(['c'])
    expect(buscarChamadas(chamadas, 'RW-43/2026').map((c) => c.id)).toEqual(['a'])
  })

  it('busca pelo texto da Solução', () => {
    const comSolucao = [
      chamadaBase({
        id: 'a',
        chamada: 'A-1',
        titulo: 'Base.',
        descricaoCompleta: 'Base.',
        solucao: 'Ajuste no cálculo aplicado.'
      }),
      chamadaBase({
        id: 'b',
        chamada: 'B-2',
        titulo: 'Base.',
        descricaoCompleta: 'Base.',
        solucao: 'Nova rotina entregue.'
      })
    ]
    expect(buscarChamadas(comSolucao, 'cálculo').map((c) => c.id)).toEqual(['a'])
    expect(buscarChamadas(comSolucao, 'entregue').map((c) => c.id)).toEqual(['b'])
  })

  it('busca e filtra por softwares secundários', () => {
    const multi = [
      chamadaBase({
        id: 'a',
        chamada: 'A-1',
        titulo: 'Base.',
        descricaoCompleta: 'Base.',
        softwareIds: ['SFT-001', 'SFT-900'],
        softwares: ['Teorema ERP', 'Arquivos Digitais - SPED']
      })
    ]
    expect(buscarChamadas(multi, 'sped').map((c) => c.id)).toEqual(['a'])
    expect(filtrarChamadas(multi, { ...semFiltro, softwareIds: ['SFT-900'] }).map((c) => c.id)).toEqual([
      'a'
    ])
    expect(filtrarChamadas(multi, { ...semFiltro, softwareIds: ['SFT-999'] }).map((c) => c.id)).toEqual(
      []
    )
  })

  it('calcula os KPIs por status', () => {
    expect(calcularKpis(chamadas)).toEqual({
      total: 3,
      revisar: 1,
      aprovado: 1,
      recusado: 0
    })
  })
})

describe('guarda de exclusão', () => {
  it('permite excluir chamada em Revisar e sem histórico', () => {
    const chamada = chamadaBase()
    expect(podeExcluir(chamada)).toBe(true)
    expect(motivoBloqueioExclusao(chamada)).toBeNull()
  })

  it('bloqueia chamada aprovada/publicada', () => {
    expect(podeExcluir(chamadaBase({ status: 'Aprovado' }))).toBe(false)
    expect(motivoBloqueioExclusao(chamadaBase({ status: 'Publicar' }))).toMatch(/esteira/i)
  })

  it('bloqueia chamada com histórico', () => {
    expect(podeExcluir(chamadaBase({ temHistorico: true }))).toBe(false)
    expect(motivoBloqueioExclusao(chamadaBase({ temHistorico: true }))).toMatch(/histórico/i)
  })
})

describe('guarda de aprovação', () => {
  it('permite aprovar chamada em Revisar', () => {
    expect(podeAprovar(chamadaBase())).toBe(true)
    expect(motivoBloqueioAprovacao(chamadaBase())).toBeNull()
  })

  it('bloqueia chamada já aprovada ou publicada', () => {
    expect(podeAprovar(chamadaBase({ status: 'Aprovado' }))).toBe(false)
    expect(motivoBloqueioAprovacao(chamadaBase({ status: 'Aprovado' }))).toMatch(/aprovada/i)
    expect(podeAprovar(chamadaBase({ status: 'Publicar' }))).toBe(false)
    expect(motivoBloqueioAprovacao(chamadaBase({ status: 'Publicar' }))).toMatch(/publicada/i)
    expect(podeAprovar(chamadaBase({ status: 'Recusado' }))).toBe(false)
    expect(motivoBloqueioAprovacao(chamadaBase({ status: 'Recusado' }))).toMatch(/recusada/i)
  })
})

describe('guarda de desaprovação', () => {
  it('permite desaprovar chamada Aprovada', () => {
    const chamada = chamadaBase({ status: 'Aprovado' })
    expect(podeDesaprovar(chamada)).toBe(true)
    expect(motivoBloqueioDesaprovacao(chamada)).toBeNull()
  })

  it('bloqueia desaprovação fora de Aprovado', () => {
    expect(podeDesaprovar(chamadaBase())).toBe(false)
    expect(motivoBloqueioDesaprovacao(chamadaBase())).toMatch(/aprovadas/i)
    expect(podeDesaprovar(chamadaBase({ status: 'Recusado' }))).toBe(false)
    expect(podeDesaprovar(chamadaBase({ status: 'Publicar' }))).toBe(false)
  })
})

describe('guarda de recusa', () => {
  it('permite recusar chamada em Revisar', () => {
    expect(podeRecusar(chamadaBase())).toBe(true)
    expect(motivoBloqueioRecusa(chamadaBase())).toBeNull()
  })

  it('bloqueia chamada já aprovada, recusada ou publicada', () => {
    expect(podeRecusar(chamadaBase({ status: 'Aprovado' }))).toBe(false)
    expect(motivoBloqueioRecusa(chamadaBase({ status: 'Aprovado' }))).toMatch(/aprovada/i)
    expect(podeRecusar(chamadaBase({ status: 'Recusado' }))).toBe(false)
    expect(motivoBloqueioRecusa(chamadaBase({ status: 'Recusado' }))).toMatch(/recusada/i)
    expect(podeRecusar(chamadaBase({ status: 'Publicar' }))).toBe(false)
    expect(motivoBloqueioRecusa(chamadaBase({ status: 'Publicar' }))).toMatch(/publicada/i)
  })
})
