// server/utils/manuais.ts — camada de acesso do módulo Manuais Mensais.
// Regras puras vêm de `#shared/manuais` (mesmas da tela/testes). As rotas
// aplicam RBAC e auditoria; aqui ficam validação, código MAN-XX/AAAA, datas,
// arquivamento soft, guarda de exclusão e importação transacional.
import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { query, getTransaction } from './db'
import { reconciliarFilhasPublicacao } from './publicacao-pais'
import type { AtorTransicao } from './historico-esteira'
import {
  MESES,
  STATUS_MANUAL,
  dataPublicacaoAoPublicar,
  ehDataIso,
  gerarCodigo,
  hojeIso,
  validarManual,
  type ItemManual,
  type ManuaisModelo,
  type StatusManual
} from '#shared/manuais'

const LIMITE_IMPORTACAO = 500
const ATOR_SISTEMA: AtorTransicao = { nome: 'Sistema', perfil: 'Sistema' }

const atorDeAutor = (autor: AutorManual): AtorTransicao => ({
  id: autor.id,
  nome: autor.nome ?? 'Sistema',
  perfil: autor.perfil
})
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function erro400(mensagem: string, data?: unknown): never {
  throw createError({ statusCode: 400, statusMessage: mensagem, data })
}
function erro404(mensagem = 'Manual não encontrado.'): never {
  throw createError({ statusCode: 404, statusMessage: mensagem })
}
function erro409(mensagem: string, data?: unknown): never {
  throw createError({ statusCode: 409, statusMessage: mensagem, data })
}

type Row = Record<string, unknown>

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor)

/** Valida o id do path (UUID); inválido -> 404. */
export function validarIdManual(id: unknown): string {
  const valor = typeof id === 'string' ? id.trim() : ''
  if (!UUID_RE.test(valor)) erro404()
  return valor
}

const dataIso = (valor: unknown): string => {
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'string' && valor) {
    const d = new Date(valor)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
    return valor
  }
  return ''
}

const dataDia = (valor: unknown): string => {
  if (valor instanceof Date) {
    const y = valor.getFullYear()
    const m = String(valor.getMonth() + 1).padStart(2, '0')
    const d = String(valor.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return texto(valor).slice(0, 10)
}

const montarManual = (row: Row): ManuaisModelo => ({
  id: texto(row.id),
  codigo: texto(row.codigo),
  titulo: texto(row.titulo),
  descricao: texto(row.descricao),
  ano: Number(row.ano ?? 0),
  mes: texto(row.mes),
  mesNumero: Number(row.mes_numero ?? 0),
  status: (texto(row.status) || 'Rascunho') as StatusManual,
  destaqueMes: Number(row.destaque_mes ?? 0) === 1,
  destaqueSemana: Number(row.destaque_semana ?? 0) === 1,
  totalVisualizacoes: Number(row.total_visualizacoes ?? 0),
  autorNome: texto(row.autor_nome),
  revisorNome: texto(row.revisor_nome),
  arquivada: Number(row.arquivada ?? 0) === 1,
  dataCriacao: dataDia(row.data_criacao),
  dataPublicacao: dataDia(row.data_publicacao),
  criadoEm: dataIso(row.criado_em),
  atualizadoEm: dataIso(row.atualizado_em),
  itensCount: Number(row.itens_count ?? 0)
})

const COLUNAS = `m.id, m.codigo, m.titulo, m.descricao, m.ano, m.mes, m.mes_numero,
  m.status, m.destaque_mes, m.destaque_semana, m.total_visualizacoes, m.arquivada,
  m.data_criacao, m.data_publicacao, m.criado_em, m.atualizado_em,
  COALESCE(ua.nome_completo, '') AS autor_nome,
  COALESCE(ur.nome_completo, '') AS revisor_nome,
  (SELECT COUNT(*) FROM entregas_itens e WHERE e.manual_id = m.id) AS itens_count`

const JOINS = `FROM manuais_mensal m
  LEFT JOIN usuarios ua ON ua.id = m.autor_id
  LEFT JOIN usuarios ur ON ur.id = m.revisor_id`

// ---------------------------------------------------------------------------
// Validação de entrada
// ---------------------------------------------------------------------------

export interface EntradaManual {
  titulo?: unknown
  descricao?: unknown
  mes?: unknown
  ano?: unknown
  status?: unknown
  destaqueMes?: unknown
  destaqueSemana?: unknown
  dataCriacao?: unknown
  dataPublicacao?: unknown
}

export interface AutorManual {
  id: string
  nome?: string
  perfil?: string
}

interface ManualValidado {
  titulo: string
  descricao: string
  mes: string
  mesNumero: number
  ano: number
  status: StatusManual
  destaqueMes: boolean
  destaqueSemana: boolean
  dataCriacao: string
  dataPublicacao: string
}

/**
 * Valida/normaliza a entrada. `exigirDataPublicacao` é usado na importação:
 * uma linha com status `Publicado` precisa trazer a data histórica.
 */
export function validarEntradaManual(
  dados: EntradaManual,
  exigirDataPublicacao = false
): ManualValidado {
  const resultado = validarManual(dados)
  const erros: Record<string, string> = { ...resultado.erros }

  const status = (typeof dados.status === 'string' && dados.status) || 'Rascunho'
  if (!STATUS_MANUAL.includes(status as StatusManual)) {
    erros.status = 'Status inválido.'
  }

  const dataCriacao = typeof dados.dataCriacao === 'string' ? dados.dataCriacao.trim() : ''
  if (dataCriacao && !ehDataIso(dataCriacao)) {
    erros.dataCriacao = 'Data de criação inválida.'
  }

  const dataPublicacao =
    typeof dados.dataPublicacao === 'string' ? dados.dataPublicacao.trim() : ''
  if (dataPublicacao && !ehDataIso(dataPublicacao)) {
    erros.dataPublicacao = 'Data de publicação inválida.'
  }
  if (status === 'Publicado' && exigirDataPublicacao && !dataPublicacao) {
    erros.dataPublicacao = 'Informe a data de publicação para o status Publicado.'
  }

  const primeiro = Object.values(erros)[0]
  if (primeiro) {
    erro400(primeiro, { erros })
  }

  const mes = String(dados.mes)
  const mesNumero = MESES.indexOf(mes as (typeof MESES)[number]) + 1

  return {
    titulo: String(dados.titulo).trim(),
    descricao: typeof dados.descricao === 'string' ? dados.descricao.trim() : '',
    mes,
    mesNumero,
    ano: Number(dados.ano),
    status: status as StatusManual,
    destaqueMes: dados.destaqueMes === true || dados.destaqueMes === 1,
    destaqueSemana: dados.destaqueSemana === true || dados.destaqueSemana === 1,
    dataCriacao,
    dataPublicacao
  }
}

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------

/** Manuais não arquivados, com a contagem de itens (GET /api/manuais). */
export async function listarManuais(): Promise<ManuaisModelo[]> {
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS} ${JOINS} WHERE m.arquivada = 0 ORDER BY m.ano DESC, m.mes_numero DESC`
  )
  return linhas.map(montarManual)
}

/** Um manual por id (inclui arquivados — usado em edição/exclusão). */
export async function buscarManual(id: string): Promise<ManuaisModelo | null> {
  const linhas = await query<Row[]>(`SELECT ${COLUNAS} ${JOINS} WHERE m.id = ? LIMIT 1`, [id])
  const linha = linhas[0]
  return linha ? montarManual(linha) : null
}

/** Itens (entregas_itens) vinculados ao manual, somente leitura. */
export async function listarItensManual(id: string): Promise<ItemManual[]> {
  const linhas = await query<Row[]>(
    `SELECT id, manual_id, chamada, titulo, software, modulo, tipo, impacto,
            status, data_liberacao
       FROM entregas_itens
      WHERE manual_id = ?
      ORDER BY chamada ASC`,
    [id]
  )
  return linhas.map((row) => ({
    id: texto(row.id),
    manualId: texto(row.manual_id),
    chamada: texto(row.chamada),
    titulo: texto(row.titulo),
    software: texto(row.software),
    modulo: texto(row.modulo),
    tipo: texto(row.tipo) as ItemManual['tipo'],
    impacto: texto(row.impacto) as ItemManual['impacto'],
    status: texto(row.status) as ItemManual['status'],
    dataLiberacao: dataDia(row.data_liberacao)
  }))
}

// ---------------------------------------------------------------------------
// Escritas
// ---------------------------------------------------------------------------

export async function criarManual(
  dados: EntradaManual,
  autor: AutorManual
): Promise<ManuaisModelo> {
  const validada = validarEntradaManual(dados)
  const id = randomUUID()
  const codigo = gerarCodigo(validada.mesNumero, validada.ano)
  const dataCriacao = validada.dataCriacao || hojeIso()
  const dataPublicacao =
    validada.dataPublicacao || (validada.status === 'Publicado' ? hojeIso() : null)

  const tx = await getTransaction()
  try {
    await tx.query(
      `INSERT INTO manuais_mensal
        (id, codigo, ano, mes, mes_numero, titulo, descricao, status,
         destaque_mes, destaque_semana, autor_id, data_criacao, data_publicacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        codigo,
        validada.ano,
        validada.mes,
        validada.mesNumero,
        validada.titulo,
        validada.descricao,
        validada.status,
        validada.destaqueMes ? 1 : 0,
        validada.destaqueSemana ? 1 : 0,
        autor.id,
        dataCriacao,
        dataPublicacao
      ]
    )
    if (validada.status === 'Publicado') {
        await reconciliarFilhasPublicacao(tx, 'manual', id, atorDeAutor(autor))
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('Já existe um catálogo para este mês/ano.', {
        erros: { mes: 'Já existe um catálogo para este mês/ano.' }
      })
    }
    throw erro
  }

  const criado = await buscarManual(id)
  if (!criado) erro404('Falha ao criar o manual.')
  return criado
}

export async function atualizarManual(
  id: string,
  dados: EntradaManual,
  ator: AtorTransicao = ATOR_SISTEMA
): Promise<ManuaisModelo> {
  const atual = await buscarManual(id)
  if (!atual) erro404()

  const mesclado: EntradaManual = {
    titulo: 'titulo' in dados ? dados.titulo : atual.titulo,
    descricao: 'descricao' in dados ? dados.descricao : atual.descricao,
    mes: 'mes' in dados ? dados.mes : atual.mes,
    ano: 'ano' in dados ? dados.ano : atual.ano,
    status: 'status' in dados ? dados.status : atual.status,
    destaqueMes: 'destaqueMes' in dados ? dados.destaqueMes : atual.destaqueMes,
    destaqueSemana: 'destaqueSemana' in dados ? dados.destaqueSemana : atual.destaqueSemana,
    dataCriacao: atual.dataCriacao,
    dataPublicacao: 'dataPublicacao' in dados ? dados.dataPublicacao : atual.dataPublicacao
  }

  const validada = validarEntradaManual(mesclado)
  const codigo = gerarCodigo(validada.mesNumero, validada.ano)
  const dataPublicacao =
    validada.dataPublicacao || (validada.status === 'Publicado' ? hojeIso() : null)

  const tx = await getTransaction()
  try {
    await tx.query(
      `UPDATE manuais_mensal
          SET codigo = ?, titulo = ?, descricao = ?, ano = ?, mes = ?, mes_numero = ?,
              status = ?, destaque_mes = ?, destaque_semana = ?, data_publicacao = ?
        WHERE id = ?`,
      [
        codigo,
        validada.titulo,
        validada.descricao,
        validada.ano,
        validada.mes,
        validada.mesNumero,
        validada.status,
        validada.destaqueMes ? 1 : 0,
        validada.destaqueSemana ? 1 : 0,
        dataPublicacao,
        id
      ]
    )
    if (atual.status !== validada.status) {
      await reconciliarFilhasPublicacao(tx, 'manual', id, ator)
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('Já existe um catálogo para este mês/ano.', {
        erros: { mes: 'Já existe um catálogo para este mês/ano.' }
      })
    }
    throw erro
  }

  const atualizado = await buscarManual(id)
  if (!atualizado) erro404()
  return atualizado
}

export async function publicarManual(
  id: string,
  ator: AtorTransicao = ATOR_SISTEMA
): Promise<ManuaisModelo & { chamadasPublicadas: number }> {
  const atual = await buscarManual(id)
  if (!atual) erro404()
  const dataPublicacao = dataPublicacaoAoPublicar(atual.dataPublicacao)
  const tx = await getTransaction()
  let publicadas = 0
  try {
    await tx.query("UPDATE manuais_mensal SET status = 'Publicado', data_publicacao = ? WHERE id = ?", [
      dataPublicacao,
      id
    ])
    const resultado = await reconciliarFilhasPublicacao(tx, 'manual', id, ator)
    publicadas = resultado.publicadas
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
  const publicado = await buscarManual(id)
  if (!publicado) erro404()
  return { ...publicado, chamadasPublicadas: publicadas }
}

export async function arquivarManual(id: string): Promise<ManuaisModelo> {
  const atual = await buscarManual(id)
  if (!atual) erro404()
  await query('UPDATE manuais_mensal SET arquivada = 1 WHERE id = ?', [id])
  const arquivada = await buscarManual(id)
  if (!arquivada) erro404()
  return arquivada
}

export async function excluirManual(id: string): Promise<void> {
  const atual = await buscarManual(id)
  if (!atual) erro404()
  if (atual.arquivada) erro409('Catálogo arquivado não pode ser excluído.')

  const itens = await query<Array<{ total: number }>>(
    'SELECT COUNT(*) AS total FROM entregas_itens WHERE manual_id = ?',
    [id]
  )
  if (Number(itens[0]?.total ?? 0) > 0) {
    erro409('Catálogo com itens vinculados não pode ser excluído.')
  }

  const anexos = await query<Array<{ total: number }>>(
    'SELECT COUNT(*) AS total FROM anexos_midias WHERE manual_id = ?',
    [id]
  )
  if (Number(anexos[0]?.total ?? 0) > 0) {
    erro409('Catálogo com anexos vinculados não pode ser excluído.')
  }

  await query('DELETE FROM manuais_mensal WHERE id = ?', [id])
}

// ---------------------------------------------------------------------------
// Importação
// ---------------------------------------------------------------------------

export async function importarManuais(
  linhas: unknown,
  autor: AutorManual
): Promise<{ importados: number }> {
  if (!Array.isArray(linhas) || linhas.length === 0) {
    erro400('Envie ao menos uma linha para importar.')
  }
  if (linhas.length > LIMITE_IMPORTACAO) {
    erro400(`Limite de ${LIMITE_IMPORTACAO} linhas por importação.`)
  }

  const motivos: string[] = []
  const preparados: ManualValidado[] = []
  const vistos = new Set<string>()

  for (const [indice, linha] of linhas.entries()) {
    try {
      const validada = validarEntradaManual((linha ?? {}) as EntradaManual, true)
      const chave = `${validada.ano}-${validada.mesNumero}`
      if (vistos.has(chave)) erro400('mês/ano repetido no arquivo.')
      vistos.add(chave)
      preparados.push(validada)
    } catch (erro) {
      const mensagem = (erro as { statusMessage?: string }).statusMessage ?? 'Linha inválida.'
      motivos.push(`Linha ${indice + 1}: ${mensagem}`)
    }
  }

  if (preparados.length === 0 || motivos.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A importação contém linhas inválidas — nada foi gravado.',
      data: { motivos: motivos.length ? motivos : ['Nenhuma linha válida para importar.'] }
    })
  }

  const existentes = await query<Array<{ ano: number; mes_numero: number }>>(
    'SELECT ano, mes_numero FROM manuais_mensal'
  )
  const naBase = new Set(
    existentes.map((e) => `${Number(e.ano)}-${Number(e.mes_numero)}`)
  )
  const conflitos = preparados
    .filter((p) => naBase.has(`${p.ano}-${p.mesNumero}`))
    .map((p) => `${p.mes}/${p.ano}`)
  if (conflitos.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A importação contém meses/anos já cadastrados — nada foi gravado.',
      data: {
        motivos: conflitos.map((c) => `Mês já cadastrado: ${c}.`),
        conflitos
      }
    })
  }

  const tx = await getTransaction()
  try {
    for (const p of preparados) {
      const id = randomUUID()
      await tx.query(
        `INSERT INTO manuais_mensal
          (id, codigo, ano, mes, mes_numero, titulo, descricao, status,
           destaque_mes, destaque_semana, autor_id, data_criacao, data_publicacao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          gerarCodigo(p.mesNumero, p.ano),
          p.ano,
          p.mes,
          p.mesNumero,
          p.titulo,
          p.descricao,
          p.status,
          p.destaqueMes ? 1 : 0,
          p.destaqueSemana ? 1 : 0,
          autor.id,
          p.dataCriacao || hojeIso(),
          p.dataPublicacao || null
        ]
      )
      if (p.status === 'Publicado') {
      await reconciliarFilhasPublicacao(tx, 'manual', id, atorDeAutor(autor))
      }
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('A importação encontrou meses/anos em conflito — nada foi gravado.')
    }
    throw erro
  }

  return { importados: preparados.length }
}
