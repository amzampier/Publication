import { describe, it, expect } from 'vitest'
import {
  FILTROS_ESTEIRA_VAZIOS,
  calcularProgresso,
  filtrarItensEsteira,
  itemVisivelNoPortal,
  origemDoItem,
  podeTransicionar,
  rotuloVinculo,
  statusRevisaoDoPai,
  validarParecer,
  type ContextoVinculo,
  type ItemEsteira
} from '../shared/esteira-revisao'
import type { ChamadaModelo, StatusChamada } from '../shared/lancar-chamadas'

const contexto = (
  id: string,
  codigo: string,
  status = 'Em Andamento',
  arquivada = false
): ContextoVinculo => ({
  id,
  codigo,
  nome: `Contexto ${codigo}`,
  status,
  arquivada
})

const base = (): ChamadaModelo => ({
  id: 'item-1',
  origem: 'Release',
  releaseId: 'rel-1',
  projetoId: '',
  manualId: '',
  softwareIds: ['SW1'],
  parceiroId: '',
  autorId: 'user-1',
  autorNome: 'Autora',
  chamada: '100',
  dataLancamento: '2026-10-05',
  dataLiberacao: '2026-10-12',
  release: 'RW-39/2026',
  titulo: 'Ajuste fiscal',
  parceiro: 'Parceiro A',
  softwares: ['Software A'],
  modulo: 'Fiscal',
  menuFuncionalidade: 'Notas',
  tipo: 'Correção',
  impacto: 'Médio',
  situacao: 'Desenvolvimento',
  descricaoCompleta: 'Descrição da chamada',
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
  criadoEm: '2026-10-05T10:00:00.000Z',
  atualizadoEm: '2026-10-05T10:00:00.000Z'
})

const item = (parcial: Partial<ItemEsteira> = {}): ItemEsteira => ({
  ...base(),
  contexto: { release: contexto('rel-1', 'RW-39/2026'), manual: null, projeto: null },
  revisorId: '',
  revisorNome: '',
  dataDecisao: '',
  parecer: '',
  ...parcial
})

const comStatus = (status: StatusChamada, parcial: Partial<ItemEsteira> = {}): ItemEsteira =>
  item({ status, ...parcial })

describe('calcularProgresso', () => {
  it('zera o progresso sem chamadas', () => {
    const progresso = calcularProgresso([])
    expect(progresso).toMatchObject({
      total: 0,
      revisar: 0,
      aprovado: 0,
      recusado: 0,
      publicar: 0,
      revisado: 0,
      percentualRevisado: 0,
      percentualAprovado: 0
    })
    expect(progresso.porVinculo.release.total).toBe(0)
  })

  it('conta status e percentuais globais', () => {
    const itens = [
      comStatus('Revisar'),
      comStatus('Aprovado', {
        contexto: {
          release: contexto('rel-1', 'RW-39/2026'),
          manual: contexto('man-1', 'MAN-10/2026'),
          projeto: null
        }
      }),
      comStatus('Recusado', {
        contexto: { release: null, manual: contexto('man-1', 'MAN-10/2026'), projeto: null }
      }),
      comStatus('Publicar', {
        contexto: { release: null, manual: null, projeto: contexto('proj-1', 'PE-2026') }
      })
    ]
    const progresso = calcularProgresso(itens)
    expect(progresso).toMatchObject({
      total: 4,
      revisar: 1,
      aprovado: 1,
      recusado: 1,
      publicar: 1,
      revisado: 2,
      percentualRevisado: 50,
      percentualAprovado: 25
    })
  })

  it('quebra por vínculo e conta o multi-vínculo em cada origem', () => {
    const itens = [
      comStatus('Revisar'),
      comStatus('Aprovado', {
        contexto: {
          release: contexto('rel-1', 'RW-39/2026'),
          manual: contexto('man-1', 'MAN-10/2026'),
          projeto: null
        }
      }),
      comStatus('Recusado', {
        contexto: { release: null, manual: contexto('man-1', 'MAN-10/2026'), projeto: null }
      }),
      comStatus('Publicar', {
        contexto: { release: null, manual: null, projeto: contexto('proj-1', 'PE-2026') }
      })
    ]
    const progresso = calcularProgresso(itens)
    expect(progresso.porVinculo.release).toMatchObject({
      total: 2,
      revisar: 1,
      aprovado: 1,
      revisado: 1,
      percentualRevisado: 50,
      percentualAprovado: 50
    })
    expect(progresso.porVinculo.manual).toMatchObject({
      total: 2,
      aprovado: 1,
      recusado: 1,
      revisado: 1,
      percentualRevisado: 50,
      percentualAprovado: 50
    })
    expect(progresso.porVinculo.projeto).toMatchObject({
      total: 1,
      publicar: 1,
      revisado: 1,
      percentualAprovado: 0
    })
  })

  it('ignora vínculo arquivado ou publicado na quebra por origem', () => {
    const progresso = calcularProgresso([
      comStatus('Revisar', {
        contexto: {
          release: contexto('rel-1', 'RW-39/2026', 'Publicado'),
          manual: contexto('man-1', 'MAN-10/2026', 'Em Andamento', true),
          projeto: null
        }
      })
    ])
    expect(progresso.porVinculo.release.total).toBe(0)
    expect(progresso.porVinculo.manual.total).toBe(0)
    expect(progresso.total).toBe(1)
  })
})

describe('filtrarItensEsteira', () => {
  const itens = [
    comStatus('Revisar', {
      chamada: '200',
      titulo: 'Correção de nota',
      release: 'RW-40/2026',
      contexto: {
        release: contexto('rel-2', 'RW-40/2026'),
        manual: contexto('man-1', 'MAN-10/2026'),
        projeto: null
      },
      tags: ['Fiscal', 'Nota']
    }),
    comStatus('Aprovado', {
      chamada: '100',
      titulo: 'Melhoria no estoque',
      contexto: {
        release: null,
        manual: null,
        projeto: contexto('proj-1', 'PE-2026')
      },
      tipo: 'Melhoria',
      impacto: 'Alto',
      dataLiberacao: '2026-11-03'
    }),
    comStatus('Recusado', {
      chamada: '300',
      titulo: 'Manual de implantação',
      contexto: {
        release: null,
        manual: contexto('man-2', 'MAN-11/2026'),
        projeto: null
      },
      dataLiberacao: ''
    })
  ]

  it('filtra pela aba', () => {
    expect(filtrarItensEsteira(itens, FILTROS_ESTEIRA_VAZIOS, '', 'revisar').map((i) => i.chamada)).toEqual(['200'])
    expect(filtrarItensEsteira(itens, FILTROS_ESTEIRA_VAZIOS, '', 'recusado').map((i) => i.chamada)).toEqual(['300'])
    expect(filtrarItensEsteira(itens, FILTROS_ESTEIRA_VAZIOS, '', 'aprovado').map((i) => i.chamada)).toEqual(['100'])
    expect(filtrarItensEsteira(itens, FILTROS_ESTEIRA_VAZIOS, '', 'todas').map((i) => i.chamada)).toEqual(['100', '200', '300'])
  })

  it('filtra por status e por origem/vínculo', () => {
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, status: 'Aprovado' }, '').map((i) => i.chamada)).toEqual(['100'])
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, origem: 'Release' }, '').map((i) => i.chamada)).toEqual(['200'])
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, origem: 'Manual' }, '').map((i) => i.chamada)).toEqual(['200', '300'])
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, origem: 'Projeto' }, '').map((i) => i.chamada)).toEqual(['100'])
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, origem: 'Ambos' }, '').map((i) => i.chamada)).toEqual(['200'])
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, releaseId: 'rel-2' }, '').map((i) => i.chamada)).toEqual(['200'])
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, projetoId: 'proj-1' }, '').map((i) => i.chamada)).toEqual(['100'])
  })

  it('filtra por tipo, impacto, software e período', () => {
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, tipo: 'Melhoria' }, '').map((i) => i.chamada)).toEqual(['100'])
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, impacto: 'Alto' }, '').map((i) => i.chamada)).toEqual(['100'])
    expect(filtrarItensEsteira(itens, { ...FILTROS_ESTEIRA_VAZIOS, softwareId: 'SW1' }, '').length).toBe(3)
    expect(
      filtrarItensEsteira(
        itens,
        { ...FILTROS_ESTEIRA_VAZIOS, dataLiberacaoDe: '2026-11-01', dataLiberacaoAte: '2026-11-30' },
        ''
      ).map((i) => i.chamada)
    ).toEqual(['100'])
  })

  it('filtra por parceiro', () => {
    const comParceiro = [
      item({ chamada: '400', parceiroId: 'par-1' }),
      item({ chamada: '500', parceiroId: 'par-2' })
    ]
    expect(
      filtrarItensEsteira(
        comParceiro,
        { ...FILTROS_ESTEIRA_VAZIOS, parceiroId: 'par-1' },
        ''
      ).map((i) => i.chamada)
    ).toEqual(['400'])
  })

  it('busca ignorando acentos e cobrindo vínculos', () => {
    expect(filtrarItensEsteira(itens, FILTROS_ESTEIRA_VAZIOS, 'correcao').map((i) => i.chamada)).toEqual(['200'])
    expect(filtrarItensEsteira(itens, FILTROS_ESTEIRA_VAZIOS, 'MAN-11').map((i) => i.chamada)).toEqual(['300'])
    expect(filtrarItensEsteira(itens, FILTROS_ESTEIRA_VAZIOS, 'PE-2026').map((i) => i.chamada)).toEqual(['100'])
  })

  it('ordena por chamada com comparação numérica natural', () => {
    expect(filtrarItensEsteira(itens, FILTROS_ESTEIRA_VAZIOS, '', 'todas').map((i) => i.chamada)).toEqual(['100', '200', '300'])
  })
})

describe('transições e parecer', () => {
  it('permite aprovar e recusar apenas em Revisar', () => {
    expect(podeTransicionar('Revisar', 'aprovar')).toBe(true)
    expect(podeTransicionar('Revisar', 'recusar')).toBe(true)
    expect(podeTransicionar('Revisar', 'reabrir')).toBe(false)
  })

  it('permite reabrir apenas em Aprovado ou Recusado', () => {
    expect(podeTransicionar('Aprovado', 'reabrir')).toBe(true)
    expect(podeTransicionar('Recusado', 'reabrir')).toBe(true)
    expect(podeTransicionar('Aprovado', 'aprovar')).toBe(false)
    expect(podeTransicionar('Recusado', 'recusar')).toBe(false)
    expect(podeTransicionar('Publicar', 'reabrir')).toBe(false)
  })

  it('publica apenas a partir de Aprovado e suspende apenas de Publicado', () => {
    expect(podeTransicionar('Aprovado', 'publicar')).toBe(true)
    expect(podeTransicionar('Revisar', 'publicar')).toBe(false)
    expect(podeTransicionar('Recusado', 'publicar')).toBe(false)
    expect(podeTransicionar('Publicar', 'suspender')).toBe(true)
    expect(podeTransicionar('Aprovado', 'suspender')).toBe(false)
  })

  it('exige parecer apenas na recusa', () => {
    expect(validarParecer('recusar', '')).toBe('Informe o parecer da recusa.')
    expect(validarParecer('recusar', '   ')).toBe('Informe o parecer da recusa.')
    expect(validarParecer('recusar', 'Falta de evidência.')).toBeNull()
    expect(validarParecer('aprovar', '')).toBeNull()
    expect(validarParecer('reabrir', '')).toBeNull()
  })

  it('limita o tamanho do parecer', () => {
    expect(validarParecer('aprovar', 'a'.repeat(4001))).toMatch(/4000/)
  })
})

describe('rótulos de vínculo', () => {
  it('deriva a origem a partir dos vínculos', () => {
    expect(origemDoItem(item())).toBe('Release')
    expect(
      origemDoItem(
        item({
          contexto: {
            release: contexto('rel-1', 'RW-39/2026'),
            manual: contexto('man-1', 'MAN-10/2026'),
            projeto: null
          }
        })
      )
    ).toBe('Ambos')
  })

  it('rotula os códigos dos vínculos', () => {
    expect(rotuloVinculo(item())).toBe('RW-39/2026')
    expect(
      rotuloVinculo(
        item({
          contexto: {
            release: contexto('rel-1', 'RW-39/2026'),
            manual: contexto('man-1', 'MAN-10/2026'),
            projeto: null
          }
        })
      )
    ).toBe('RW-39/2026 · MAN-10/2026')
  })
})

describe('status do conteúdo pai e visibilidade no portal', () => {
  it('define o status de revisão do pai', () => {
    expect(statusRevisaoDoPai('release')).toBe('Em Revisão')
    expect(statusRevisaoDoPai('manual')).toBe('Em Revisão')
    expect(statusRevisaoDoPai('projeto')).toBe('Homologação')
  })

  it('só é visível no portal com item Publicar e ao menos um pai Publicado', () => {
    const publicado = item({
      status: 'Publicar',
      contexto: {
        release: contexto('rel-1', 'RW-39/2026', 'Publicado'),
        manual: null,
        projeto: null
      }
    })
    expect(itemVisivelNoPortal(publicado)).toBe(true)

    const paiEmRevisao = item({
      status: 'Publicar',
      contexto: {
        release: contexto('rel-1', 'RW-39/2026', 'Em Revisão'),
        manual: null,
        projeto: null
      }
    })
    expect(itemVisivelNoPortal(paiEmRevisao)).toBe(false)

    const itemAprovado = item({
      status: 'Aprovado',
      contexto: {
        release: contexto('rel-1', 'RW-39/2026', 'Publicado'),
        manual: null,
        projeto: null
      }
    })
    expect(itemVisivelNoPortal(itemAprovado)).toBe(false)

    const multi = item({
      status: 'Publicar',
      contexto: {
        release: contexto('rel-1', 'RW-39/2026', 'Em Revisão'),
        manual: contexto('man-1', 'MAN-10/2026', 'Publicado'),
        projeto: null
      }
    })
    expect(itemVisivelNoPortal(multi)).toBe(true)
  })
})
