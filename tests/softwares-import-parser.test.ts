import { describe, it, expect } from 'vitest'
import { classificarLinhas } from '../app/components/softwares/lerPlanilhaSoftwares'

const CATEGORIAS = ['Delphi', 'Web', 'Delphi e Web']
const SITUACOES = ['Ativo', 'Inativo']

describe('classificarLinhas (importação de softwares)', () => {
  it('marca pronta a linha válida e inédita', () => {
    const linhas = classificarLinhas(
      [{ descricao: 'Teorema CRM', categoria: 'Web', situacao: 'Ativo' }],
      [],
      CATEGORIAS,
      SITUACOES
    )
    expect(linhas[0]?.situacaoImportacao).toBe('pronto')
  })

  it('marca ja-cadastrado quando a descrição existe na base (case-insensitive)', () => {
    const linhas = classificarLinhas(
      [{ descricao: 'teorema erp', categoria: 'Delphi', situacao: 'Ativo' }],
      ['Teorema ERP'],
      CATEGORIAS,
      SITUACOES
    )
    expect(linhas[0]?.situacaoImportacao).toBe('ja-cadastrado')
  })

  it('marca repetido quando a descrição aparece duas vezes no arquivo', () => {
    const linhas = classificarLinhas(
      [
        { descricao: 'Teorema CRM', categoria: 'Web', situacao: 'Ativo' },
        { descricao: 'Teorema CRM', categoria: 'Web', situacao: 'Ativo' }
      ],
      [],
      CATEGORIAS,
      SITUACOES
    )
    expect(linhas[0]?.situacaoImportacao).toBe('pronto')
    expect(linhas[1]?.situacaoImportacao).toBe('repetido')
  })

  it('marca invalido com motivo para campos fora do domínio', () => {
    const linhas = classificarLinhas(
      [{ descricao: '', categoria: 'Mobile', situacao: 'Suspenso' }],
      [],
      CATEGORIAS,
      SITUACOES
    )
    expect(linhas[0]?.situacaoImportacao).toBe('invalido')
    expect(linhas[0]?.motivo).toContain('Descrição ausente')
    expect(linhas[0]?.motivo).toContain('Categoria inválida')
    expect(linhas[0]?.motivo).toContain('Situação inválida')
  })

  it('ignora linhas totalmente vazias', () => {
    const linhas = classificarLinhas(
      [{ descricao: '', categoria: '', situacao: '' }],
      [],
      CATEGORIAS,
      SITUACOES
    )
    expect(linhas).toHaveLength(0)
  })
})
