import { describe, it, expect } from 'vitest'
import {
  classificarLinhasChamadas,
  lerPlanilhaLancarChamadas,
  COLUNAS_MODELO_CHAMADA,
  type LinhaBrutaChamada
} from '../app/components/lancar-chamadas/lerPlanilhaLancarChamadas'
import type { CatalogosChamada } from '../shared/lancar-chamadas'

const catalogos: CatalogosChamada = {
  releases: [
    { id: 'rw-1', label: 'RW-43/2026 - Release Week 43', sigla: 'RW-43/2026', dataPublicacao: '2026-10-26' }
  ],
  projetos: [{ id: 'pe-1', label: 'PE-2026.01', sigla: 'PE-2026.01' }],
  manuais: [{ id: 'man-1', label: 'MAN-10/2026', sigla: 'MAN-10/2026' }],
  softwares: [{ id: 'SFT-001', label: 'Teorema ERP', sigla: 'SFT-001' }],
  parceiros: [{ id: 'par-1', label: 'Grupo Andrade', sigla: 'PAR-001' }]
}

const linha = (over: Partial<LinhaBrutaChamada> = {}): LinhaBrutaChamada => ({
  chamada: 'CH-2026-9001',
  titulo: 'Ajuste fiscal',
  dataLancamento: '19/10/2026',
  dataLiberacao: '',
  release: 'RW-43/2026',
  projeto: '',
  manual: '',
  software: 'SFT-001',
  parceiro: 'PAR-001',
  modulo: 'Fiscal',
  menuFuncionalidade: 'Notas',
  tipo: 'Correção',
  impacto: 'Alto',
  descricaoCompleta: 'Descrição completa da chamada.',
  manualTitulo: '',
  linkManual: '',
  linkVideo: '',
  tags: 'fiscal; nf-e; fiscal',
  ...over
})

describe('classificarLinhasChamadas', () => {
  it('classifica linha válida e herda a data de liberação da release', () => {
    const [resultado] = classificarLinhasChamadas([linha()], [], catalogos)
    expect(resultado?.situacaoImportacao).toBe('pronto')
    expect(resultado?.dataLancamento).toBe('2026-10-19')
    expect(resultado?.dataLiberacao).toBe('2026-10-26')
    expect(resultado?.releaseCodigo).toBe('RW-43/2026')
    expect(resultado?.softwareCodigo).toBe('SFT-001')
    expect(resultado?.parceiroCodigo).toBe('PAR-001')
    expect(resultado?.tags).toEqual(['fiscal', 'nf-e'])
  })

  it('marca chamada já cadastrada e repetida no arquivo', () => {
    const jaCadastrada = classificarLinhasChamadas([linha()], ['ch-2026-9001'], catalogos)
    expect(jaCadastrada[0]?.situacaoImportacao).toBe('ja-cadastrado')

    const repetida = classificarLinhasChamadas([linha(), linha()], [], catalogos)
    expect(repetida[0]?.situacaoImportacao).toBe('pronto')
    expect(repetida[1]?.situacaoImportacao).toBe('repetido')
  })

  it('marca inválida quando falta vínculo ou código', () => {
    const semVinculo = classificarLinhasChamadas(
      [linha({ release: '', projeto: '', manual: '' })],
      [],
      catalogos
    )
    expect(semVinculo[0]?.situacaoImportacao).toBe('invalido')
    expect(semVinculo[0]?.motivo).toMatch(/ao menos uma release/i)

    const semSoftware = classificarLinhasChamadas([linha({ software: '' })], [], catalogos)
    expect(semSoftware[0]?.situacaoImportacao).toBe('invalido')
    expect(semSoftware[0]?.motivo).toMatch(/software/i)

    const codigoInexistente = classificarLinhasChamadas(
      [linha({ parceiro: 'PAR-999' })],
      [],
      catalogos
    )
    expect(codigoInexistente[0]?.situacaoImportacao).toBe('invalido')
    expect(codigoInexistente[0]?.motivo).toMatch(/parceiro/i)

    const terca = classificarLinhasChamadas([linha({ dataLancamento: '20/10/2026' })], [], catalogos)
    expect(terca[0]?.situacaoImportacao).toBe('pronto')
    expect(terca[0]?.dataLancamento).toBe('2026-10-20')
  })

  it('aceita projeto ou manual como vínculo e não exige liberação', () => {
    const projeto = classificarLinhasChamadas(
      [linha({ release: '', projeto: 'PE-2026.01', dataLiberacao: '' })],
      [],
      catalogos
    )
    expect(projeto[0]?.situacaoImportacao).toBe('pronto')
    expect(projeto[0]?.dataLiberacao).toBe('')

    const manual = classificarLinhasChamadas(
      [linha({ release: '', manual: 'MAN-10/2026' })],
      [],
      catalogos
    )
    expect(manual[0]?.situacaoImportacao).toBe('pronto')
  })

  it('normaliza tipo e impacto sem diferenciar maiúsculas', () => {
    const [resultado] = classificarLinhasChamadas(
      [linha({ tipo: 'correção', impacto: 'alto' })],
      [],
      catalogos
    )
    expect(resultado?.situacaoImportacao).toBe('pronto')
    expect(resultado?.tipo).toBe('Correção')
    expect(resultado?.impacto).toBe('Alto')
  })

  it('lê o arquivo .xlsx com o cabeçalho de 18 colunas', async () => {
    const ExcelJS = (await import('exceljs')) as any
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Chamadas')
    ws.addRow([...COLUNAS_MODELO_CHAMADA])
    ws.addRow([
      'CH-2026-9001',
      'Ajuste fiscal',
      '19/10/2026',
      '',
      'RW-43/2026',
      '',
      '',
      'SFT-001',
      'PAR-001',
      'Fiscal',
      'Notas',
      'Correção',
      'Alto',
      'Descrição completa da chamada.',
      '',
      '',
      '',
      'fiscal; nf-e'
    ])
    const buffer = await wb.xlsx.writeBuffer()
    const arquivo = new File([buffer], 'modelo.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const resultado = await lerPlanilhaLancarChamadas(arquivo, [], catalogos)
    expect(resultado.erro).toBeNull()
    expect(resultado.linhas[0]?.situacaoImportacao).toBe('pronto')
    expect(resultado.linhas[0]?.dataLiberacao).toBe('2026-10-26')
  })
})
