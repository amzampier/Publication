import { describe, it, expect } from 'vitest'
import {
  buscarEscopos,
  calcularKpis,
  filtrarEscopos,
  formatarPeriodo,
  gerarCodigo,
  motivoBloqueioExclusao,
  podeExcluir,
  proximoCodigo,
  softwaresDosItens,
  softwaresTexto,
  validarEscopo,
  type ItemProjeto,
  type ProjetoEscopoModelo
} from '../app/components/escopo-projetos/validadores'

const escopo = (overrides: Partial<ProjetoEscopoModelo> = {}): ProjetoEscopoModelo => ({
  id: 'esc-1',
  codigo: 'PE-2026.01',
  nome: 'Escopo Anual 2026',
  versao: 'v2026.1',
  ano: 2026,
  dataInicio: '2026-01-05',
  dataFinal: '2026-12-31',
  dataPrevisao: '2026-12-20',
  dataPublicacao: '2026-01-02',
  status: 'Em Andamento',
  softwaresContemplados: ['SFT-001'],
  descricaoGeral: 'Escopo de exemplo',
  totalVisualizacoes: 100,
  itensCount: 0,
  arquivada: false,
  criadoEm: '2026-01-02T09:00:00.000Z',
  atualizadoEm: '2026-01-02T09:00:00.000Z',
  ...overrides
})

const dadosValidos = {
  nome: 'Escopo Teste',
  versao: 'v2026.1',
  ano: 2026,
  dataInicio: '2026-01-05',
  dataFinal: '2026-12-31',
  dataPrevisao: '2026-12-20',
  dataPublicacao: '2026-01-02',
  status: 'Em Andamento' as const,
  descricaoGeral: 'Descrição'
}

describe('validarEscopo', () => {
  it('exige nome, versão, ano e datas', () => {
    const resultado = validarEscopo({})
    expect(resultado.valido).toBe(false)
    expect(resultado.erros.nome).toBeTruthy()
    expect(resultado.erros.versao).toBeTruthy()
    expect(resultado.erros.ano).toBeTruthy()
    expect(resultado.erros.dataInicio).toBeTruthy()
    expect(resultado.erros.dataFinal).toBeTruthy()
    expect(resultado.primeiroErro).toBe('nome')
  })

  it('aceita um escopo válido', () => {
    expect(validarEscopo(dadosValidos).valido).toBe(true)
  })

  it('recusa data final anterior à inicial', () => {
    const resultado = validarEscopo({ ...dadosValidos, dataFinal: '2025-12-31' })
    expect(resultado.valido).toBe(false)
    expect(resultado.erros.dataFinal).toContain('anterior')
  })

  it('recusa ano fora do intervalo', () => {
    const resultado = validarEscopo({ ...dadosValidos, ano: 1800 })
    expect(resultado.erros.ano).toBeTruthy()
  })

  it('recusa código duplicado, exceto o próprio registro', () => {
    const existente = escopo()
    expect(
      validarEscopo({ ...dadosValidos, codigo: 'PE-2026.01' }, [existente]).erros.codigo
    ).toBeTruthy()
    expect(
      validarEscopo({ ...dadosValidos, codigo: 'PE-2026.01' }, [existente], 'esc-1').valido
    ).toBe(true)
  })
})

describe('código do escopo', () => {
  it('gera PE-<ano>.<sequencial>', () => {
    expect(gerarCodigo(2026, 1)).toBe('PE-2026.01')
    expect(gerarCodigo(2026, 12)).toBe('PE-2026.12')
  })

  it('calcula o próximo código do ano', () => {
    expect(proximoCodigo(2027, [])).toBe('PE-2027.01')
    expect(
      proximoCodigo(2026, [
        escopo({ id: 'a', codigo: 'PE-2026.01' }),
        escopo({ id: 'b', codigo: 'PE-2026.03' }),
        escopo({ id: 'c', codigo: 'PE-2025.09' })
      ])
    ).toBe('PE-2026.04')
  })
})

describe('filtros, busca e KPIs', () => {
  const base = [
    escopo({ id: 'a', codigo: 'PE-2026.01', nome: 'A', ano: 2026, versao: 'v2026.1', status: 'Em Andamento' }),
    escopo({ id: 'b', codigo: 'PE-2026.02', nome: 'B', ano: 2026, versao: 'v2026.2', status: 'Homologação' }),
    escopo({ id: 'c', codigo: 'PE-2025.01', nome: 'C', ano: 2025, versao: 'v2025.1', status: 'Concluído' }),
    escopo({ id: 'd', codigo: 'PE-2025.02', nome: 'D', ano: 2025, versao: 'v2025.2', status: 'Publicado' }),
    escopo({ id: 'e', codigo: 'PE-2024.01', nome: 'E', ano: 2024, versao: 'v2024.1', status: 'Publicado' }),
    escopo({ id: 'f', codigo: 'PE-2026.03', nome: 'F', ano: 2026, versao: 'v2026.3', status: 'Publicado', arquivada: true })
  ]

  it('exclui arquivados e ordena por ano/nome', () => {
    const filtrados = filtrarEscopos(base, {
      status: '',
      ano: '',
      versao: '',
      software: ''
    })
    expect(filtrados.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('aplica status, ano, versão e software', () => {
    expect(
      filtrarEscopos(base, {
        status: 'Publicado',
        ano: '2025',
        versao: 'v2025.2',
        software: 'SFT-001'
      }).map((e) => e.id)
    ).toEqual(['d'])
  })

  it('busca por código, nome, descrição e software', () => {
    expect(buscarEscopos(base, 'pe-2026.02').map((e) => e.id)).toEqual(['b'])
    expect(buscarEscopos(base, 'escopo de exemplo').map((e) => e.id)).toHaveLength(6)
    expect(buscarEscopos(base, 'teorema erp').map((e) => e.id)).toHaveLength(6)
    expect(buscarEscopos(base, 'inexistente')).toEqual([])
  })

  it('calcula os quatro KPIs', () => {
    expect(calcularKpis(base.filter((e) => !e.arquivada))).toEqual({
      emAndamento: 1,
      homologacao: 1,
      concluidos: 1,
      publicados: 2
    })
  })
})

describe('softwares contemplados derivados dos itens', () => {
  const item = (overrides: Partial<ItemProjeto> = {}): ItemProjeto => ({
    id: 'item-1',
    projetoId: 'esc-1',
    chamada: '0000581201',
    titulo: 'Item de exemplo',
    software: 'Teorema ERP',
    modulo: 'Fiscal',
    tipo: 'Melhoria',
    impacto: 'Médio',
    situacao: 'Desenvolvimento',
    status: 'Revisar',
    dataLiberacao: '2026-03-16',
    ...overrides
  })

  it('deriva códigos únicos na ordem de aparição', () => {
    expect(
      softwaresDosItens([
        item({ id: 'a', software: 'Teorema WMS' }),
        item({ id: 'b', software: 'Teorema ERP' }),
        item({ id: 'c', software: 'Teorema WMS' })
      ])
    ).toEqual(['SFT-002', 'SFT-001'])
  })

  it('ignora softwares fora do catálogo e lista vazia sem itens', () => {
    expect(softwaresDosItens([item({ software: 'Software legado' })])).toEqual([])
    expect(softwaresDosItens([])).toEqual([])
  })
})

describe('guarda de exclusão', () => {
  it('bloqueia escopo arquivado', () => {
    const arquivado = escopo({ arquivada: true })
    expect(motivoBloqueioExclusao(arquivado)).toContain('arquivado')
    expect(podeExcluir(arquivado)).toBe(false)
  })

  it('bloqueia escopo com itens', () => {
    const comItens = escopo({ itensCount: 2 })
    expect(motivoBloqueioExclusao(comItens)).toContain('itens')
    expect(podeExcluir(comItens)).toBe(false)
  })

  it('permite escopo sem vínculos', () => {
    expect(motivoBloqueioExclusao(escopo())).toBeNull()
    expect(podeExcluir(escopo())).toBe(true)
  })
})

describe('helpers de apresentação', () => {
  it('formata período e softwares', () => {
    expect(formatarPeriodo('2026-01-05', '2026-12-31')).toBe('05/01/2026 a 31/12/2026')
    expect(softwaresTexto(['SFT-001', 'SFT-002'])).toBe('Teorema ERP, Teorema WMS')
    expect(softwaresTexto([])).toBe('—')
  })
})
