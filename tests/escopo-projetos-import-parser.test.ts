import { describe, expect, it } from 'vitest'
import {
  classificarLinhasEscopoProjetos,
  type LinhaBrutaEscopo
} from '../app/components/escopo-projetos/lerPlanilhaEscopoProjetos'

const linha = (overrides: Partial<LinhaBrutaEscopo> = {}): LinhaBrutaEscopo => ({
  nome: 'Escopo Importado',
  versao: 'v2026.1',
  ano: '2026',
  dataInicio: '05/01/2026',
  dataFinal: '31/12/2026',
  dataPrevisao: '20/12/2026',
  dataPublicacao: '02/01/2026',
  status: 'Em Andamento',
  descricaoGeral: 'Descrição do escopo',
  ...overrides
})

describe('classificarLinhasEscopoProjetos', () => {
  it('classifica uma linha válida como pronta e normaliza as datas', () => {
    const [resultado] = classificarLinhasEscopoProjetos([linha()], [])
    expect(resultado?.situacaoImportacao).toBe('pronto')
    expect(resultado?.dataInicio).toBe('2026-01-05')
    expect(resultado?.dataPublicacao).toBe('2026-01-02')
  })

  it('marca linha já cadastrada pela chave (ano, versão)', () => {
    const [resultado] = classificarLinhasEscopoProjetos([linha()], ['2026-v2026.1'])
    expect(resultado?.situacaoImportacao).toBe('ja-cadastrado')
  })

  it('marca repetição no arquivo, inclusive com versão em caixa diferente', () => {
    const resultados = classificarLinhasEscopoProjetos(
      [linha(), linha({ nome: 'Outro', versao: 'V2026.1' })],
      []
    )
    expect(resultados[1]?.situacaoImportacao).toBe('repetido')
  })

  it('aceita data de publicação em qualquer dia e recusa malformada', () => {
    const terca = classificarLinhasEscopoProjetos([linha({ dataPublicacao: '27/10/2026' })], [])
    expect(terca[0]?.situacaoImportacao).toBe('pronto')
    expect(terca[0]?.dataPublicacao).toBe('2026-10-27')

    const sabado = classificarLinhasEscopoProjetos([linha({ dataPublicacao: '31/10/2026' })], [])
    expect(sabado[0]?.situacaoImportacao).toBe('pronto')

    const invalida = classificarLinhasEscopoProjetos([linha({ dataPublicacao: '31/02/2026' })], [])
    expect(invalida[0]?.situacaoImportacao).toBe('invalido')
    expect(invalida[0]?.motivo).toMatch(/data de publicação/i)
  })

  it('recusa o status Publicado na importação', () => {
    const [resultado] = classificarLinhasEscopoProjetos(
      [linha({ status: 'Publicado' })],
      []
    )
    expect(resultado?.situacaoImportacao).toBe('invalido')
    expect(resultado?.motivo).toContain('não pode criar registros Publicados')
  })

  it('recusa campo obrigatório, data e status inválidos', () => {
    const [resultado] = classificarLinhasEscopoProjetos(
      [linha({ nome: '', dataInicio: '31/02/2026', status: 'Inexistente' })],
      []
    )
    expect(resultado?.situacaoImportacao).toBe('invalido')
    expect(resultado?.motivo).toContain('nome')
    expect(resultado?.motivo).toContain('Status inválido')
  })

  it('ignora linhas totalmente vazias', () => {
    const vazia = linha({
      nome: '',
      versao: '',
      ano: '',
      dataInicio: '',
      dataFinal: '',
      dataPrevisao: '',
      dataPublicacao: '',
      status: '',
      descricaoGeral: ''
    })
    expect(classificarLinhasEscopoProjetos([vazia], [])).toEqual([])
  })

  it('aplica o status padrão Em Andamento', () => {
    const [resultado] = classificarLinhasEscopoProjetos([linha({ status: '' })], [])
    expect(resultado?.status).toBe('Em Andamento')
    expect(resultado?.situacaoImportacao).toBe('pronto')
  })
})
