import { describe, it, expect } from 'vitest'
import {
  classificarLinhasReleaseWeek,
  type LinhaBrutaReleaseWeek
} from '../app/components/release-week/lerPlanilhaReleaseWeek'

const linha = (over: Partial<LinhaBrutaReleaseWeek> = {}): LinhaBrutaReleaseWeek => ({
  nome: 'Release Week 43',
  versao: '26.10c',
  release: '26.10c10.12a',
  semana: '43',
  ano: '2026',
  mes: 'Outubro',
  dataInicio: '2026-10-19',
  dataFinaliza: '2026-10-23',
  dataPublicacao: '2026-10-26',
  status: 'Aberta',
  descricao: '',
  destaque: 'Não',
  ...over
})

describe('classificarLinhasReleaseWeek', () => {
  it('marca pronta a linha válida e inédita', () => {
    const [r] = classificarLinhasReleaseWeek([linha()], [])
    expect(r?.situacaoImportacao).toBe('pronto')
  })

  it('marca repetida quando o (ano, semana) se repete no arquivo', () => {
    const linhas = classificarLinhasReleaseWeek([linha(), linha()], [])
    expect(linhas.map((l) => l.situacaoImportacao)).toEqual(['pronto', 'repetido'])
  })

  it('marca já cadastrada quando o (ano, semana) existe na base', () => {
    const [r] = classificarLinhasReleaseWeek([linha()], ['2026-43'])
    expect(r?.situacaoImportacao).toBe('ja-cadastrado')
  })

  it('recusa data de publicação que não é segunda-feira', () => {
    const [r] = classificarLinhasReleaseWeek([linha({ dataPublicacao: '2026-10-27' })], [])
    expect(r?.situacaoImportacao).toBe('invalido')
    expect(r?.motivo).toMatch(/segunda-feira/i)
  })

  it('recusa nome ausente, semana fora de 1–52 e status inválido', () => {
    const [r] = classificarLinhasReleaseWeek(
      [linha({ nome: '', semana: '60', status: 'Encerrada' })],
      []
    )
    expect(r?.situacaoImportacao).toBe('invalido')
    expect(r?.motivo).toMatch(/nome/i)
    expect(r?.motivo).toMatch(/semana/i)
    expect(r?.motivo).toMatch(/status/i)
  })

  it('ignora linha totalmente vazia', () => {
    const vazia = linha({
      nome: '',
      versao: '',
      release: '',
      semana: '',
      ano: '',
      mes: '',
      dataInicio: '',
      dataFinaliza: '',
      dataPublicacao: '',
      status: '',
      descricao: ''
    })
    expect(classificarLinhasReleaseWeek([vazia], [])).toEqual([])
  })
})
