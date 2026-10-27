import { describe, it, expect } from 'vitest'
import {
  COLUNAS_MODELO,
  classificarLinhasManuais,
  type LinhaBrutaManual
} from '../app/components/manuais/lerPlanilhaManuais'

const linha = (overrides: Partial<LinhaBrutaManual> = {}): LinhaBrutaManual => ({
  titulo: 'Manual de Integrações — Outubro',
  mes: 'Outubro',
  ano: '2026',
  descricao: 'APIs, webhooks e conectores',
  status: 'Aprovado',
  dataCriacao: '01/10/2026',
  dataPublicacao: '',
  destaqueMes: 'Sim',
  destaqueSemana: 'Não',
  ...overrides
})

describe('classificarLinhasManuais', () => {
  it('classifica linha válida e normaliza a data', () => {
    const [resultado] = classificarLinhasManuais([linha()], [])
    expect(resultado?.situacaoImportacao).toBe('pronto')
    expect(resultado?.dataCriacao).toBe('2026-10-01')
    expect(resultado?.destaqueMes).toBe('Sim')
    expect(resultado?.destaqueSemana).toBe('Não')
  })

  it('recusa o status Publicado na importação', () => {
    const [semData] = classificarLinhasManuais([linha({ status: 'Publicado' })], [])
    expect(semData?.situacaoImportacao).toBe('invalido')
    expect(semData?.motivo).toContain('não pode criar registros Publicados')

    const [comData] = classificarLinhasManuais(
      [linha({ status: 'Publicado', dataPublicacao: '2026-09-28' })],
      []
    )
    expect(comData?.situacaoImportacao).toBe('invalido')
    expect(comData?.motivo).toContain('não pode criar registros Publicados')
  })

  it('recusa mês, status e datas inválidos', () => {
    const [resultado] = classificarLinhasManuais(
      [linha({ mes: 'Outubroo', status: 'Inexistente', dataCriacao: '2026-02-30' })],
      []
    )
    expect(resultado?.situacaoImportacao).toBe('invalido')
    expect(resultado?.motivo).toContain('mês')
    expect(resultado?.motivo).toContain('Status inválido')
    expect(resultado?.motivo).toContain('Data de criação inválida')
  })

  it('marca repetido no arquivo e já cadastrado na base', () => {
    const linhas = classificarLinhasManuais(
      [
        linha({ titulo: 'Primeiro' }),
        linha({ titulo: 'Repetido' }),
        linha({ titulo: 'Setembro', mes: 'Setembro' })
      ],
      ['2026-9']
    )
    expect(linhas.map((l) => l.situacaoImportacao)).toEqual([
      'pronto',
      'repetido',
      'ja-cadastrado'
    ])
  })

  it('ignora linha totalmente vazia', () => {
    const vazia = linha({
      titulo: '',
      mes: '',
      ano: '',
      descricao: '',
      status: '',
      dataCriacao: '',
      dataPublicacao: '',
      destaqueMes: '',
      destaqueSemana: ''
    })
    expect(classificarLinhasManuais([vazia], [])).toEqual([])
  })

  it('declara o cabeçalho do modelo', () => {
    expect(COLUNAS_MODELO).toEqual([
      'Título',
      'Mês',
      'Ano',
      'Descrição',
      'Status',
      'Data de Criação',
      'Data de Publicação',
      'Destaque do mês',
      'Destaque da semana'
    ])
  })
})
