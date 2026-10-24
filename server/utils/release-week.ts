// server/utils/release-week.ts — camada de acesso do módulo Release Week
// (change release-week-backend-e-importacao). Regras puras vêm de
// `#shared/release-week` (mesmas da tela/testes). As rotas aplicam RBAC e
// auditoria; aqui ficam validação, código RW-XX/AAAA, arquivamento soft e a
// guarda de exclusão (arquivada ou com itens).
import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { query, getTransaction, inserirEmLotes } from './db'
import { reconciliarFilhasPublicacao } from './publicacao-pais'
import type { AtorTransicao } from './historico-esteira'
import {
  STATUS_RELEASE,
  dataPublicacaoValida,
  gerarCodigo,
  validarReleaseWeek,
  type ItemRelease,
  type ReleaseWeekModelo,
  type StatusRelease
} from '#shared/release-week'

const LIMITE_IMPORTACAO = 500
const ATOR_SISTEMA: AtorTransicao = { nome: 'Sistema', perfil: 'Sistema' }
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function erro400(mensagem: string, data?: unknown): never {
  throw createError({ statusCode: 400, statusMessage: mensagem, data })
}
function erro404(mensagem = 'Release Week não encontrada.'): never {
  throw createError({ statusCode: 404, statusMessage: mensagem })
}
function erro409(mensagem: string): never {
  throw createError({ statusCode: 409, statusMessage: mensagem })
}

type Row = Record<string, unknown>

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor)

/** Valida o id do path (UUID); inválido -> 404. */
export function validarIdRelease(id: unknown): string {
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
  // DATE do MySQL volta como string AAAA-MM-DD; normaliza para ISO do dia.
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

const montarReleaseWeek = (row: Row): ReleaseWeekModelo => ({
  id: texto(row.id),
  codigo: texto(row.codigo),
  nome: texto(row.nome),
  versao: texto(row.versao),
  release: texto(row.release),
  semana: Number(row.semana ?? 0),
  ano: Number(row.ano ?? 0),
  mes: texto(row.mes),
  dataInicio: dataDia(row.data_inicio),
  dataFinaliza: dataDia(row.data_finaliza),
  dataPublicacao: dataDia(row.data_publicacao),
  status: (texto(row.status) || 'Aberta') as StatusRelease,
  descricao: texto(row.descricao),
  destaqueSemana: Number(row.destaque_semana ?? 0) === 1,
  arquivada: Number(row.arquivada ?? 0) === 1,
  autorNome: texto(row.autor_nome),
  revisorNome: texto(row.revisor_nome),
  criadoEm: dataIso(row.criado_em),
  atualizadoEm: dataIso(row.atualizado_em),
  itensCount: Number(row.itens_count ?? 0)
})

const COLUNAS = `r.id, r.codigo, r.nome, r.versao, r.\`release\`, r.semana, r.ano, r.mes,
  r.data_inicio, r.data_finaliza, r.data_publicacao, r.status, r.descricao,
  r.destaque_semana, r.arquivada, r.autor_nome, r.revisor_nome,
  r.criado_em, r.atualizado_em,
  (SELECT COUNT(*) FROM entregas_itens e WHERE e.release_id = r.id) AS itens_count`

// ---------------------------------------------------------------------------
// Validação de entrada
// ---------------------------------------------------------------------------

interface EntradaReleaseWeek {
  nome?: unknown
  versao?: unknown
  release?: unknown
  semana?: unknown
  ano?: unknown
  mes?: unknown
  dataInicio?: unknown
  dataFinaliza?: unknown
  dataPublicacao?: unknown
  status?: unknown
  descricao?: unknown
  destaqueSemana?: unknown
}

export interface AutorReleaseWeek {
  id: string
  nome: string
  perfil?: string
}

interface ReleaseWeekValidada {
  nome: string
  versao: string
  release: string
  semana: number
  ano: number
  mes: string
  dataInicio: string
  dataFinaliza: string
  dataPublicacao: string
  status: StatusRelease
  descricao: string
  destaqueSemana: boolean
}

const textoCurto = (valor: unknown, limite: number): string => {
  const v = typeof valor === 'string' ? valor.trim() : ''
  if (v.length > limite) erro400(`O campo deve ter no máximo ${limite} caracteres.`)
  return v
}

/**
 * Valida/normaliza a entrada. `parcial` (edição) usa os campos presentes; os
 * ausentes vêm do registro atual (merge feito pelo chamador).
 */
export function validarEntradaReleaseWeek(dados: EntradaReleaseWeek): ReleaseWeekValidada {
  const resultado = validarReleaseWeek(dados)
  if (!resultado.valido) {
    const campo = resultado.primeiroErro
    erro400(resultado.erros[campo ?? 'nome'] ?? 'Dados inválidos.', { erros: resultado.erros })
  }
  if (typeof dados.dataPublicacao === 'string' && !dataPublicacaoValida(dados.dataPublicacao)) {
    const mensagem =
      'A data de publicação deve ser uma segunda-feira ou o próximo dia útil quando a segunda-feira for feriado.'
    erro400(mensagem, { erros: { dataPublicacao: mensagem } })
  }
  const status = (typeof dados.status === 'string' && dados.status) || 'Aberta'
  if (!STATUS_RELEASE.includes(status as StatusRelease)) {
    erro400('Status inválido.')
  }
  return {
    nome: (dados.nome as string).trim(),
    versao: textoCurto(dados.versao, 50),
    release: textoCurto(dados.release, 50),
    semana: Number(dados.semana),
    ano: Number(dados.ano),
    mes: String(dados.mes),
    dataInicio: String(dados.dataInicio),
    dataFinaliza: String(dados.dataFinaliza),
    dataPublicacao: String(dados.dataPublicacao),
    status: status as StatusRelease,
    descricao: typeof dados.descricao === 'string' ? dados.descricao.slice(0, 8000) : '',
    destaqueSemana: dados.destaqueSemana === true || dados.destaqueSemana === 1
  }
}

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------

/** Releases não arquivadas, com a contagem de itens (GET /api/release-week). */
export async function listarReleaseWeeks(): Promise<ReleaseWeekModelo[]> {
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS} FROM release_week r WHERE r.arquivada = 0 ORDER BY r.ano DESC, r.semana DESC`
  )
  return linhas.map(montarReleaseWeek)
}

/** Uma release por id (inclui arquivadas — usado em edição/exclusão). */
export async function buscarReleaseWeek(id: string): Promise<ReleaseWeekModelo | null> {
  const linhas = await query<Row[]>(`SELECT ${COLUNAS} FROM release_week r WHERE r.id = ? LIMIT 1`, [id])
  const linha = linhas[0]
  return linha ? montarReleaseWeek(linha) : null
}

/** Itens (entregas_itens) vinculados à release, somente leitura. */
export async function listarItensRelease(id: string): Promise<ItemRelease[]> {
  const linhas = await query<Row[]>(
    `SELECT id, release_id, chamada, titulo, software, modulo, tipo, impacto,
            status, data_liberacao
       FROM entregas_itens
      WHERE release_id = ?
      ORDER BY chamada ASC`,
    [id]
  )
  return linhas.map((row) => ({
    id: texto(row.id),
    releaseId: texto(row.release_id),
    chamada: texto(row.chamada),
    titulo: texto(row.titulo),
    software: texto(row.software),
    modulo: texto(row.modulo),
    tipo: texto(row.tipo) as ItemRelease['tipo'],
    impacto: texto(row.impacto) as ItemRelease['impacto'],
    status: texto(row.status) as ItemRelease['status'],
    dataLiberacao: dataDia(row.data_liberacao)
  }))
}

// ---------------------------------------------------------------------------
// Escritas
// ---------------------------------------------------------------------------

export async function criarReleaseWeek(
  dados: EntradaReleaseWeek,
  autor: AutorReleaseWeek
): Promise<ReleaseWeekModelo> {
  const validada = validarEntradaReleaseWeek(dados)
  const id = randomUUID()
  const codigo = gerarCodigo(validada.semana, validada.ano)
  const tx = await getTransaction()
  try {
    await tx.query(
      `INSERT INTO release_week
        (id, codigo, nome, versao, \`release\`, semana, ano, mes,
         data_inicio, data_finaliza, data_publicacao, status, descricao,
         destaque_semana, autor_id, autor_nome, data_aprovacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               CASE WHEN ? = 'Publicado' THEN CURRENT_TIMESTAMP(6) ELSE NULL END)`,
      [
        id,
        codigo,
        validada.nome,
        validada.versao,
        validada.release,
        validada.semana,
        validada.ano,
        validada.mes,
        validada.dataInicio,
        validada.dataFinaliza,
        validada.dataPublicacao,
        validada.status,
        validada.descricao,
        validada.destaqueSemana ? 1 : 0,
        autor.id,
        autor.nome,
        validada.status
      ]
    )
    if (validada.status === 'Publicado') {
      await reconciliarFilhasPublicacao(tx, 'release', id, autor)
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('Já existe uma Release Week para esta semana/ano.')
    }
    throw erro
  }
  const criada = await buscarReleaseWeek(id)
  if (!criada) erro404('Falha ao criar a Release Week.')
  return criada
}

export async function atualizarReleaseWeek(
  id: string,
  dados: EntradaReleaseWeek,
  ator: AtorTransicao = ATOR_SISTEMA
): Promise<ReleaseWeekModelo> {
  const atual = await buscarReleaseWeek(id)
  if (!atual) erro404()

  const mesclado: EntradaReleaseWeek = {
    nome: 'nome' in dados ? dados.nome : atual.nome,
    versao: 'versao' in dados ? dados.versao : atual.versao,
    release: 'release' in dados ? dados.release : atual.release,
    semana: 'semana' in dados ? dados.semana : atual.semana,
    ano: 'ano' in dados ? dados.ano : atual.ano,
    mes: 'mes' in dados ? dados.mes : atual.mes,
    dataInicio: 'dataInicio' in dados ? dados.dataInicio : atual.dataInicio,
    dataFinaliza: 'dataFinaliza' in dados ? dados.dataFinaliza : atual.dataFinaliza,
    dataPublicacao: 'dataPublicacao' in dados ? dados.dataPublicacao : atual.dataPublicacao,
    status: 'status' in dados ? dados.status : atual.status,
    descricao: 'descricao' in dados ? dados.descricao : atual.descricao,
    destaqueSemana: 'destaqueSemana' in dados ? dados.destaqueSemana : atual.destaqueSemana
  }
  const validada = validarEntradaReleaseWeek(mesclado)
  // Edição com mudança de semana/ano regenera o código (D4).
  const codigo = gerarCodigo(validada.semana, validada.ano)
  const tx = await getTransaction()
  try {
    await tx.query(
      `UPDATE release_week
          SET codigo = ?, nome = ?, versao = ?, \`release\` = ?, semana = ?, ano = ?, mes = ?,
              data_inicio = ?, data_finaliza = ?, data_publicacao = ?, status = ?,
              descricao = ?, destaque_semana = ?,
              data_aprovacao = CASE
                WHEN ? = 'Publicado' THEN COALESCE(data_aprovacao, CURRENT_TIMESTAMP(6))
                ELSE NULL
              END
        WHERE id = ?`,
      [
        codigo,
        validada.nome,
        validada.versao,
        validada.release,
        validada.semana,
        validada.ano,
        validada.mes,
        validada.dataInicio,
        validada.dataFinaliza,
        validada.dataPublicacao,
        validada.status,
        validada.descricao,
        validada.destaqueSemana ? 1 : 0,
        validada.status,
        id
      ]
    )
    if (atual.status !== validada.status) {
      await reconciliarFilhasPublicacao(tx, 'release', id, ator)
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('Já existe uma Release Week para esta semana/ano.')
    }
    throw erro
  }
  const atualizada = await buscarReleaseWeek(id)
  if (!atualizada) erro404()
  return atualizada
}

export async function publicarReleaseWeek(
  id: string,
  ator: AtorTransicao = ATOR_SISTEMA
): Promise<ReleaseWeekModelo & { chamadasPublicadas: number }> {
  const atual = await buscarReleaseWeek(id)
  if (!atual) erro404()
  const tx = await getTransaction()
  let publicadas = 0
  try {
    await tx.query(
      "UPDATE release_week SET status = 'Publicado', data_aprovacao = CURRENT_TIMESTAMP(6) WHERE id = ?",
      [id]
    )
    const resultado = await reconciliarFilhasPublicacao(tx, 'release', id, ator)
    publicadas = resultado.publicadas
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
  const publicado = await buscarReleaseWeek(id)
  if (!publicado) erro404()
  return { ...publicado, chamadasPublicadas: publicadas }
}

export async function arquivarReleaseWeek(id: string): Promise<ReleaseWeekModelo> {
  const atual = await buscarReleaseWeek(id)
  if (!atual) erro404()
  await query('UPDATE release_week SET arquivada = 1 WHERE id = ?', [id])
  const arquivada = await buscarReleaseWeek(id)
  if (!arquivada) erro404()
  return arquivada
}

export async function excluirReleaseWeek(id: string): Promise<void> {
  const atual = await buscarReleaseWeek(id)
  if (!atual) erro404()
  if (atual.arquivada) {
    erro409('Release arquivada não pode ser excluída.')
  }
  const itens = await query<Array<{ total: number }>>(
    'SELECT COUNT(*) AS total FROM entregas_itens WHERE release_id = ?',
    [id]
  )
  if (Number(itens[0]?.total ?? 0) > 0) {
    erro409('Release com itens vinculados não pode ser excluída.')
  }
  await query('DELETE FROM release_week WHERE id = ?', [id])
}

// ---------------------------------------------------------------------------
// Importação
// ---------------------------------------------------------------------------

export async function importarReleaseWeeks(
  linhas: unknown,
  autor: AutorReleaseWeek
): Promise<{ importados: number }> {
  if (!Array.isArray(linhas) || linhas.length === 0) {
    erro400('Envie ao menos uma linha para importar.')
  }
  if (linhas.length > LIMITE_IMPORTACAO) {
    erro400(`Limite de ${LIMITE_IMPORTACAO} linhas por importação.`)
  }

  const motivos: string[] = []
  const preparados: ReleaseWeekValidada[] = []
  const vistos = new Set<string>()

  for (const [indice, linha] of linhas.entries()) {
    try {
      const validada = validarEntradaReleaseWeek((linha ?? {}) as EntradaReleaseWeek)
      const chave = `${validada.ano}-${validada.semana}`
      if (vistos.has(chave)) erro400('semana/ano repetido no arquivo.')
      vistos.add(chave)
      preparados.push(validada)
    } catch (erro) {
      const mensagem =
        (erro as { statusMessage?: string }).statusMessage ?? 'Linha inválida.'
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

  const existentes = await query<Array<{ ano: number; semana: number }>>(
    'SELECT ano, semana FROM release_week'
  )
  const naBase = new Set(existentes.map((e) => `${Number(e.ano)}-${Number(e.semana)}`))
  const conflitos = preparados
    .filter((p) => naBase.has(`${p.ano}-${p.semana}`))
    .map((p) => `${p.semana}ª semana de ${p.ano}`)
  if (conflitos.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A importação contém semanas/anos já cadastrados — nada foi gravado.',
      data: { motivos: conflitos.map((c) => `Semana já cadastrada: ${c}.`), conflitos }
    })
  }

  const tx = await getTransaction()
  try {
    const linhas = preparados.map((p) => {
      const id = randomUUID()
      return {
        id,
        p,
        valores: [
          id,
          gerarCodigo(p.semana, p.ano),
          p.nome,
          p.versao,
          p.release,
          p.semana,
          p.ano,
          p.mes,
          p.dataInicio,
          p.dataFinaliza,
          p.dataPublicacao,
          p.status,
          p.descricao,
          p.destaqueSemana ? 1 : 0,
          autor.id,
          autor.nome
        ]
      }
    })
    await inserirEmLotes(
      tx,
      `INSERT INTO release_week
        (id, codigo, nome, versao, \`release\`, semana, ano, mes,
         data_inicio, data_finaliza, data_publicacao, status, descricao,
         destaque_semana, autor_id, autor_nome)
       VALUES`,
      16,
      linhas.map((linha) => linha.valores),
      150
    )
    for (const { id, p } of linhas) {
      if (p.status === 'Publicado') {
        await reconciliarFilhasPublicacao(tx, 'release', id, autor)
      }
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('A importação encontrou semanas/anos em conflito — nada foi gravado.')
    }
    throw erro
  }
  return { importados: preparados.length }
}
