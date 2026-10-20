import { describe, it, expect } from 'vitest'
import {
  calcularKpis,
  filtrarManuais,
  formatarData,
  gerarCodigo,
  mesPorNumero,
  motivoBloqueioExclusao,
  podeExcluirManual,
  prefillClone,
  validarManual,
  type ItemManual,
  type ManuaisModelo
} from '../app/components/manuais/validadores'

const manual = (overrides: Partial<ManuaisModelo> = {}): ManuaisModelo => ({
  id: 'man-1',
  codigo: 'MAN-10/2026',
  titulo: 'Manual de Integrações',
  descricao: 'APIs e conectores',
  ano: 2026,
  mes: 'Outubro',
  mesNumero: 10,
  status: 'Aprovado',
  destaqueMes: true,
  destaqueSemana: false,
  totalVisualizacoes: 10,
  autorNome: 'Marina Lopes',
  revisorNome: 'Rafael Souza',
  arquivada: false,
  dataCriacao: '2026-10-01',
  dataPublicacao: '',
  criadoEm: '2026-10-01T09:00:00.000Z',
  atualizadoEm: '2026-10-01T09:00:00.000Z',
  ...overrides
})

const item = (overrides: Partial<ItemManual> = {}): ItemManual => ({
  id: 'item-1',
  manualId: 'man-1',
  chamada: '0000578990',
  titulo: 'Webhook de faturamento',
  software: 'Teorema ERP',
  modulo: 'Integrações',
  tipo: 'Melhoria',
  impacto: 'Médio',
  situacao: 'Implantado',
  status: 'Publicar',
  dataLiberacao: '2026-10-12',
  ...overrides
})

describe('validarManual', () => {
  it('exige título, mês e ano', () => {
    const resultado = validarManual({})
    expect(resultado.valido).toBe(false)
    expect(resultado.erros.titulo).toBeTruthy()
    expect(resultado.erros.mes).toBeTruthy()
    expect(resultado.erros.ano).toBeTruthy()
    expect(resultado.primeiroErro).toBe('titulo')
  })

  it('recusa mês fora do domínio e ano inválido', () => {
    const resultado = validarManual({ titulo: 'Manual', mes: 'Outubroo', ano: 1800 })
    expect(resultado.erros.mes).toBeTruthy()
    expect(resultado.erros.ano).toBeTruthy()
  })

  it('aceita um catálogo válido', () => {
    expect(validarManual({ titulo: 'Manual', mes: 'Outubro', ano: 2026 }).valido).toBe(true)
  })

  it('recusa (ano, mês) já existente', () => {
    const resultado = validarManual(
      { titulo: 'Outro manual', mes: 'Outubro', ano: 2026 },
      [manual()]
    )
    expect(resultado.valido).toBe(false)
    expect(resultado.erros.mes).toBe('Já existe um catálogo para este mês/ano.')
  })

  it('permite o próprio registro na edição', () => {
    expect(
      validarManual({ titulo: 'Manual editado', mes: 'Outubro', ano: 2026 }, [manual()], 'man-1')
        .valido
    ).toBe(true)
  })
})

describe('prefillClone', () => {
  it('copia apenas conteúdo e destaques', () => {
    const origem = manual({ destaqueMes: true, destaqueSemana: true })
    expect(prefillClone(origem)).toEqual({
      titulo: origem.titulo,
      descricao: origem.descricao,
      destaqueMes: true,
      destaqueSemana: true
    })
  })
})

describe('guarda de exclusão', () => {
  it('bloqueia catálogo arquivado', () => {
    const arquivado = manual({ arquivada: true })
    expect(motivoBloqueioExclusao(arquivado, [])).toContain('arquivado')
    expect(podeExcluirManual(arquivado, [])).toBe(false)
  })

  it('bloqueia catálogo com itens', () => {
    expect(motivoBloqueioExclusao(manual(), [item()])).toContain('itens')
    expect(podeExcluirManual(manual(), [item()])).toBe(false)
  })

  it('permite catálogo sem vínculos', () => {
    expect(motivoBloqueioExclusao(manual(), [])).toBeNull()
    expect(podeExcluirManual(manual(), [])).toBe(true)
  })
})

describe('filtros e KPIs', () => {
  const base = [
    manual({ id: 'a', status: 'Rascunho', mes: 'Junho', mesNumero: 6, autorNome: 'Ana' }),
    manual({ id: 'b', status: 'Em Revisão', mes: 'Julho', mesNumero: 7, autorNome: 'Bia' }),
    manual({ id: 'c', status: 'Alterações Solicitadas', mes: 'Agosto', mesNumero: 8, autorNome: 'Caio' }),
    manual({ id: 'd', status: 'Aprovado', mes: 'Setembro', mesNumero: 9, autorNome: 'Duda' }),
    manual({
      id: 'e',
      status: 'Publicado',
      mes: 'Outubro',
      mesNumero: 10,
      autorNome: 'Eva',
      destaqueMes: true,
      destaqueSemana: true
    }),
    manual({ id: 'f', status: 'Publicado', mes: 'Maio', mesNumero: 5, arquivada: true })
  ]

  it('exclui arquivados e ordena por ano/mês desc', () => {
    const filtrados = filtrarManuais(base, {
      status: '',
      ano: '',
      mes: '',
      autor: '',
      destaque: ''
    })
    expect(filtrados.map((m) => m.id)).toEqual(['e', 'd', 'c', 'b', 'a'])
  })

  it('aplica status, ano, mês, autor e destaque', () => {
    expect(
      filtrarManuais(base, {
        status: 'Publicado',
        ano: '2026',
        mes: 'Outubro',
        autor: 'Eva',
        destaque: 'mes'
      }).map((m) => m.id)
    ).toEqual(['e'])
    expect(
      filtrarManuais(base, {
        status: '',
        ano: '',
        mes: '',
        autor: '',
        destaque: 'semana'
      }).map((m) => m.id)
    ).toEqual(['e'])
  })

  it('calcula os cinco KPIs', () => {
    expect(calcularKpis(base.filter((m) => !m.arquivada))).toEqual({
      rascunho: 1,
      emRevisao: 1,
      alteracoes: 1,
      aprovados: 1,
      publicados: 1
    })
  })
})

describe('helpers de domínio', () => {
  it('gera o código MAN-XX/AAAA', () => {
    expect(gerarCodigo(1, 2026)).toBe('MAN-01/2026')
    expect(gerarCodigo(10, 2026)).toBe('MAN-10/2026')
  })

  it('mapeia o numeral para o mês por extenso', () => {
    expect(mesPorNumero(1)).toBe('Janeiro')
    expect(mesPorNumero(12)).toBe('Dezembro')
    expect(mesPorNumero(0)).toBeNull()
    expect(mesPorNumero(13)).toBeNull()
  })

  it('formata datas civis sem deslocamento de fuso', () => {
    expect(formatarData('2026-10-12')).toBe('12/10/2026')
    expect(formatarData('')).toBe('—')
  })
})
