import { describe, it, expect } from 'vitest'
import {
  calcularKpis,
  ehSegundaFeira,
  filtrarSemanas,
  formatarData,
  gerarCodigo,
  motivoBloqueioExclusao,
  podeExcluirRelease,
  prefillClone,
  validarReleaseWeek,
  type ItemRelease,
  type ReleaseWeekModelo
} from '../shared/release-week'

const semanaBase = (over: Partial<ReleaseWeekModelo> = {}): ReleaseWeekModelo => ({
  id: 'rw-1',
  codigo: 'RW-40/2026',
  nome: 'Release Week 40',
  versao: '26.09c',
  release: '26.09c09.21a',
  semana: 40,
  ano: 2026,
  mes: 'Setembro',
  dataInicio: '2026-09-28',
  dataFinaliza: '2026-10-02',
  dataPublicacao: '2026-10-05',
  status: 'Aberta',
  descricao: '',
  destaqueSemana: true,
  arquivada: false,
  autorNome: 'Ana Carolina Ribeiro',
  revisorNome: '',
  criadoEm: '2026-01-01T00:00:00.000Z',
  atualizadoEm: '2026-01-01T00:00:00.000Z',
  ...over
})

const itemBase = (over: Partial<ItemRelease> = {}): ItemRelease => ({
  id: 'item-1',
  releaseId: 'rw-1',
  chamada: '0001',
  titulo: 'Correção',
  software: 'Portal',
  modulo: 'Publicações',
  tipo: 'Correção',
  impacto: 'Baixo',
  situacao: 'Implantado',
  status: 'Publicar',
  dataLiberacao: '2026-09-28',
  ...over
})

const entradaValida = {
  nome: 'Release Week 40',
  semana: 40,
  ano: 2026,
  mes: 'Setembro',
  dataInicio: '2026-09-28',
  dataFinaliza: '2026-10-02',
  dataPublicacao: '2026-10-05'
}

describe('validarReleaseWeek', () => {
  it('aceita o cabeçalho completo', () => {
    const r = validarReleaseWeek(entradaValida)
    expect(r.valido).toBe(true)
    expect(r.primeiroErro).toBeNull()
  })

  it('exige nome e limita a semana ao intervalo 1–52', () => {
    const r = validarReleaseWeek({ ...entradaValida, nome: '   ', semana: 53 })
    expect(r.valido).toBe(false)
    expect(r.erros.nome).toBeTruthy()
    expect(r.erros.semana).toBeTruthy()
    expect(r.primeiroErro).toBe('nome')
  })

  it('recusa mês fora do domínio e datas ausentes', () => {
    const r = validarReleaseWeek({
      ...entradaValida,
      mes: 'Mês inválido',
      dataInicio: '',
      dataPublicacao: '05/10/2026'
    })
    expect(r.erros.mes).toBeTruthy()
    expect(r.erros.dataInicio).toBeTruthy()
    expect(r.erros.dataPublicacao).toBeTruthy()
    expect(r.primeiroErro).toBe('mes')
  })

  it('aponta o primeiro erro na ordem dos campos', () => {
    const r = validarReleaseWeek({ nome: '', semana: 0, ano: 2026, mes: 'Outubro' })
    expect(r.primeiroErro).toBe('nome')
  })

  it('exige segunda-feira ou o próximo dia útil após feriado na segunda', () => {
    const tercaComum = validarReleaseWeek({ ...entradaValida, dataPublicacao: '2026-10-06' })
    expect(tercaComum.valido).toBe(false)
    expect(tercaComum.erros.dataPublicacao).toMatch(/segunda-feira/i)

    const segundaFeriado = validarReleaseWeek({ ...entradaValida, dataPublicacao: '2026-11-02' })
    expect(segundaFeriado.valido).toBe(false)

    const proximoDiaUtil = validarReleaseWeek({ ...entradaValida, dataPublicacao: '2026-11-03' })
    expect(proximoDiaUtil.valido).toBe(true)

    const quartaDepoisDoFeriado = validarReleaseWeek({
      ...entradaValida,
      dataPublicacao: '2026-11-04'
    })
    expect(quartaDepoisDoFeriado.valido).toBe(false)
  })

  it('aceita segunda-feira na publicação e não exige segunda nas demais datas', () => {
    const r = validarReleaseWeek({
      ...entradaValida,
      dataInicio: '2026-10-06',
      dataFinaliza: '2026-10-08',
      dataPublicacao: '2026-10-05'
    })
    expect(r.valido).toBe(true)
  })
})

describe('ehSegundaFeira', () => {
  it('identifica segunda-feira sem deslocamento de fuso', () => {
    expect(ehSegundaFeira('2026-10-05')).toBe(true)
    expect(ehSegundaFeira('2026-10-06')).toBe(false)
    expect(ehSegundaFeira('data-invalida')).toBe(false)
  })
})

describe('prefillClone', () => {
  it('copia apenas versão, release e destaque', () => {
    const prefill = prefillClone(semanaBase({ destaqueSemana: true }))
    expect(prefill).toEqual({
      versao: '26.09c',
      release: '26.09c09.21a',
      destaqueSemana: true
    })
    expect(Object.keys(prefill).sort()).toEqual(['destaqueSemana', 'release', 'versao'])
  })
})

describe('podeExcluirRelease / motivoBloqueioExclusao', () => {
  it('permite excluir release não arquivada e sem itens', () => {
    const semana = semanaBase()
    expect(podeExcluirRelease(semana, [])).toBe(true)
    expect(motivoBloqueioExclusao(semana, [])).toBeNull()
  })

  it('bloqueia release com itens vinculados', () => {
    const semana = semanaBase()
    const itens = [itemBase()]
    expect(podeExcluirRelease(semana, itens)).toBe(false)
    expect(motivoBloqueioExclusao(semana, itens)).toMatch(/itens vinculados/i)
  })

  it('bloqueia release arquivada mesmo sem itens', () => {
    const semana = semanaBase({ arquivada: true })
    expect(podeExcluirRelease(semana, [])).toBe(false)
    expect(motivoBloqueioExclusao(semana, [])).toMatch(/arquivada/i)
  })
})

describe('filtrarSemanas e KPIs', () => {
  const semanas = [
    semanaBase({ id: 'a', status: 'Aberta', autorNome: 'Ana', semana: 43, ano: 2026 }),
    semanaBase({ id: 'b', status: 'Aprovado', autorNome: 'Rafael', semana: 41, ano: 2026 }),
    semanaBase({ id: 'c', status: 'Publicado', arquivada: true, semana: 38, ano: 2026 }),
    semanaBase({ id: 'd', status: 'Publicado', autorNome: 'Ana', semana: 40, ano: 2025 })
  ]

  it('nunca inclui release arquivada', () => {
    const filtradas = filtrarSemanas(semanas, { status: '', ano: '', mes: '', autor: '' })
    expect(filtradas.map((s) => s.id)).not.toContain('c')
    expect(filtradas).toHaveLength(3)
  })

  it('aplica status, ano e autor e ordena por ano/semana desc', () => {
    const filtradas = filtrarSemanas(semanas, {
      status: '',
      ano: '2026',
      mes: '',
      autor: 'Ana'
    })
    expect(filtradas.map((s) => s.id)).toEqual(['a'])
  })

  it('calcula os quatro KPIs do conjunto', () => {
    const kpis = calcularKpis(filtrarSemanas(semanas, { status: '', ano: '', mes: '', autor: '' }))
    expect(kpis).toEqual({ abertas: 1, emRevisao: 0, aprovadas: 1, publicadas: 1 })
  })
})

describe('formatarData e gerarCodigo', () => {
  it('formata ISO date sem deslocamento de fuso', () => {
    expect(formatarData('2026-10-05')).toBe('05/10/2026')
    expect(formatarData('')).toBe('—')
  })

  it('gera o código canônico da semana', () => {
    expect(gerarCodigo(4, 2026)).toBe('RW-04/2026')
    expect(gerarCodigo(40, 2026)).toBe('RW-40/2026')
  })
})
