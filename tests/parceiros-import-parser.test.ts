import { describe, it, expect } from 'vitest'
import { classificarLinhas } from '../app/components/parceiros/lerPlanilhaParceiros'

describe('classificarLinhas (importação de parceiros)', () => {
  it('marca linha válida como pronta e deriva a região da UF', () => {
    const [linha] = classificarLinhas(
      [{ razao_social: ' Nexus Corp ', nome_fantasia: 'Nexus', cidade: 'São Paulo', estado: 'sp', regiao: '', situacao: 'Ativo' }],
      []
    )
    expect(linha?.situacaoImportacao).toBe('pronto')
    expect(linha?.estado).toBe('SP')
    expect(linha?.regiao).toBe('Sudeste')
  })

  it('marca razão social já existente como já cadastrada (case-insensitive)', () => {
    const [linha] = classificarLinhas(
      [{ razao_social: 'nexus corp', nome_fantasia: 'Nexus', cidade: '', estado: '', regiao: '', situacao: 'Ativo' }],
      ['Nexus Corp']
    )
    expect(linha?.situacaoImportacao).toBe('ja-cadastrado')
  })

  it('detecta repetição no próprio arquivo', () => {
    const linhas = classificarLinhas(
      [
        { razao_social: 'Repetida', nome_fantasia: 'A', cidade: '', estado: '', regiao: '', situacao: 'Ativo' },
        { razao_social: ' repetida ', nome_fantasia: 'B', cidade: '', estado: '', regiao: '', situacao: 'Ativo' }
      ],
      []
    )
    expect(linhas[1]?.situacaoImportacao).toBe('repetido')
  })

  it('recusa situação, UF ou região inválidas', () => {
    const [linha] = classificarLinhas(
      [{ razao_social: 'X', nome_fantasia: 'Y', cidade: '', estado: 'ZZ', regiao: 'Litoral', situacao: 'Suspenso' }],
      []
    )
    expect(linha?.situacaoImportacao).toBe('invalido')
    expect(linha?.motivo).toContain('Estado inválido')
    expect(linha?.motivo).toContain('Região inválida')
    expect(linha?.motivo).toContain('Situação inválida')
  })

  it('ignora linha totalmente vazia', () => {
    const linhas = classificarLinhas(
      [{ razao_social: '', nome_fantasia: '', cidade: '', estado: '', regiao: '', situacao: '' }],
      []
    )
    expect(linhas).toHaveLength(0)
  })
})
