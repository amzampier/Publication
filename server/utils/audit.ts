// server/utils/audit.ts — trilha de auditoria centralizada (change
// auditoria-backend-integracao; docs/02 §3.6). `registrarAuditoria` grava na
// tabela `auditoria` após cada escrita bem-sucedida das rotas administrativas
// e após cada evento de autenticação (tipo 'Acesso' — login, logout, troca e
// recuperação de senha); a falha na gravação NUNCA interrompe a requisição
// principal (resiliência operacional — mesmo espelho de registrarEventoLogin
// em utils/seguranca.ts, que continua como log específico da aba Segurança).
// Mapeamento com a tela /admin/auditoria: `entidade` = "recurso" da UI,
// `entidade_id` = id da entidade afetada ('' quando não aplicável), `acao` =
// tipo da operação (um dos 4 — o que mantém o badge da tabela íntegro).
import { createError } from 'h3'
import { query } from './db'
import { cacheado } from './cache'
import { condicaoPrefixo, pareceCodigo, termoFulltext } from './busca'
import { getSessionUser } from './auth'
import { ipDoCliente } from './rateLimit'

export type AcaoAuditoria = 'Inclusão' | 'Alteração' | 'Exclusão' | 'Homologação' | 'Acesso'

const ACOES: readonly string[] = ['Inclusão', 'Alteração', 'Exclusão', 'Homologação', 'Acesso']

export interface RegistroAuditoriaApi {
  id: string
  /** ISO 8601 */
  registradoEm: string
  usuario: { id: string | null; nome: string }
  acao: AcaoAuditoria
  recurso: string
  detalhes: string
  ip: string
  /** UUID da entidade afetada (null quando não aplicável). */
  entidadeId: string | null
}

export interface FiltrosAuditoriaApi {
  /** 'yyyy-mm-dd' (dia local); vazio/ausente = sem limite */
  dataInicial?: string
  dataFinal?: string
  /** nome do operador (usuario_nome) */
  usuario?: string
  acao?: string
  recurso?: string
  /** busca textual (detalhes/usuário/recurso/ação) */
  busca?: string
  /** paginação server-side (1-based); ignorada no modo exportação */
  pagina?: number
  porPagina?: number
  /** cursor keyset (data_hora, id) para exportação em fluxo */
  cursorData?: string
  cursorId?: string
  semResumo?: boolean
  /** devolve o conjunto filtrado completo (bounded) para exportação */
  exportar?: boolean
  /** ordenação server-side (RL04-M-02): id da coluna + direção */
  ordenar?: string
  direcao?: string
}

/** Colunas ordenáveis da Gestão de Auditoria (whitelist — RL04-M-02). */
const ORDEM_AUDITORIA: Record<string, string> = {
  dataHora: 'data_hora',
  usuario: 'usuario_nome',
  acao: 'acao',
  recurso: 'entidade',
  detalhes: 'detalhes',
  ip: 'endereco_ip'
}

/** ORDER BY da auditoria (padrão = mais recente primeiro, com desempate por id). */
function montarOrdemAuditoria(ordenar?: string, direcao?: string): string {
  const coluna = ORDEM_AUDITORIA[(ordenar ?? '').trim()]
  if (!coluna) return 'data_hora DESC, id DESC'
  const dir = (direcao ?? '').trim().toLowerCase() === 'desc' ? 'DESC' : 'ASC'
  return `${coluna} ${dir}, id DESC`
}

export interface KpisAuditoria {
  registros: number
  usuariosDistintos: number
  /** ISO do registro mais recente do conjunto filtrado (null = vazio) */
  ultimaAtividade: string | null
}

export interface RespostaAuditoria {
  registros: RegistroAuditoriaApi[]
  total: number
  kpis: KpisAuditoria
  /** Conjunto NÃO filtrado — opções dos selects de filtro nunca somem */
  opcoes: { usuarios: string[]; recursos: string[] }
  pagina: number
  porPagina: number
}

const POR_PAGINA_PADRAO = 20
const POR_PAGINA_MAX = 200
const TETO_EXPORTACAO = 10_000

/** Valida uma data ISO real (AAAA-MM-DD, mês 1–12 e dia válido para o mês). */
function dataIsoValida(valor: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (!m) return false
  const ano = Number(m[1]); const mes = Number(m[2]); const dia = Number(m[3])
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false
  const d = new Date(ano, mes - 1, dia)
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia
}

interface AuditoriaRow {
  id: string
  data_hora: Date
  usuario_id: string | null
  usuario_nome: string
  acao: string
  entidade: string
  entidade_id: string | null
  endereco_ip: string
  detalhes: string
}

/**
 * Registra um evento na trilha. Nunca derruba o fluxo chamador: falha de
 * gravação é logada no console e ignorada (a operação principal continua).
 *
 * `sessao` sobrescreve a leitura do cookie — necessária em dois casos:
 * login (os cookies são da RESPOSTA, o request ainda não os tem) e
 * esqueci-senha (rota pública, sem sessão). Quando omitida, vem do token.
 */
export async function registrarAuditoria(
  event: any,
  registro: {
    acao: AcaoAuditoria
    recurso: string
    /** id da entidade afetada; opcional ('' gravado quando ausente) */
    entidadeId?: string
    detalhes: string
    /** Usuário do evento quando o request não carrega a sessão (ver acima) */
    sessao?: { id?: string | null; nome: string; perfil?: string }
  }
): Promise<void> {
  const tarefa = async (): Promise<void> => {
  try {
    if (!ACOES.includes(registro.acao)) {
      console.error('[auditoria] Ação desconhecida ignorada:', registro.acao)
      return
    }
    const usuario =
      registro.sessao ?? (await getSessionUser(event)) ?? null
    await query(
      `INSERT INTO auditoria (id, usuario_id, usuario_nome, usuario_perfil, acao, entidade, entidade_id, endereco_ip, detalhes)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario?.id ?? null,
        (usuario?.nome ?? 'Desconhecido').slice(0, 150),
        (usuario?.perfil ?? '').slice(0, 100) || '—',
        registro.acao,
        registro.recurso.slice(0, 80),
        (registro.entidadeId ?? '').slice(0, 64),
        ipDoCliente(event),
        registro.detalhes.slice(0, 8_000)
      ]
    )
  } catch (erro) {
    console.error('[auditoria] Falha ao registrar evento de auditoria:', erro)
  }
  }
  // Fora do caminho da resposta quando o runtime suporta (RL04 M-15).
  const waitUntil = (event as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil
  if (typeof waitUntil === 'function') {
    waitUntil.call(event, tarefa())
  } else {
    await tarefa()
  }
}

/**
 * Lista os registros para a tela /admin/auditoria (GET /api/auditoria).
 * Filtros/paginação/KPIs no SERVIDOR (change paginacao-server-side-e-performance):
 * devolve a página corrente + `total` + KPIs do conjunto filtrado; `opcoes`
 * sempre do conjunto completo. O modo exportação devolve o conjunto filtrado
 * completo (teto de segurança) para CSV/PDF.
 */
export async function listarAuditoria(filtros: FiltrosAuditoriaApi): Promise<RespostaAuditoria> {
  const clausulas: string[] = []
  const params: unknown[] = []

  const dataInicial = (filtros.dataInicial ?? '').trim()
  if (dataInicial) {
    if (!dataIsoValida(dataInicial)) {
      throw createError({ statusCode: 400, statusMessage: 'Data inicial inválida (use AAAA-MM-DD).' })
    }
    clausulas.push('data_hora >= ?')
    params.push(`${dataInicial} 00:00:00`)
  }
  const dataFinal = (filtros.dataFinal ?? '').trim()
  if (dataFinal) {
    if (!dataIsoValida(dataFinal)) {
      throw createError({ statusCode: 400, statusMessage: 'Data final inválida (use AAAA-MM-DD).' })
    }
    // Janela inclusiva do dia inteiro: `< início do dia seguinte` captura
    // também os microssegundos de 23:59:59 (RL02 M-06).
    clausulas.push('data_hora < DATE_ADD(?, INTERVAL 1 DAY)')
    params.push(`${dataFinal} 00:00:00`)
  }
  const usuario = (filtros.usuario ?? '').trim()
  if (usuario) {
    clausulas.push('usuario_nome = ?')
    params.push(usuario)
  }
  const acao = (filtros.acao ?? '').trim()
  if (acao) {
    clausulas.push('acao = ?')
    params.push(acao)
  }
  const recurso = (filtros.recurso ?? '').trim()
  if (recurso) {
    clausulas.push('entidade = ?')
    params.push(recurso)
  }
  const busca = (filtros.busca ?? '').trim()
  if (busca) {
    const codigo = pareceCodigo(busca)
    const fulltext = codigo ? null : termoFulltext(busca)
    if (fulltext) {
      const prefixo = condicaoPrefixo(['usuario_nome', 'entidade', 'acao'], busca)
      clausulas.push(
        `(MATCH(usuario_nome, entidade, detalhes) AGAINST (? IN BOOLEAN MODE) OR ${prefixo.sql})`
      )
      params.push(fulltext, ...prefixo.params)
    } else {
      const colunas = codigo
        ? ['usuario_nome', 'entidade', 'acao', 'detalhes']
        : ['usuario_nome', 'entidade', 'acao']
      const prefixo = condicaoPrefixo(colunas, busca)
      clausulas.push(prefixo.sql)
      params.push(...prefixo.params)
    }
  }
  if (filtros.cursorData !== undefined) {
    clausulas.push('(data_hora < ? OR (data_hora = ? AND id < ?))')
    params.push(filtros.cursorData, filtros.cursorData, filtros.cursorId ?? '')
  }
  const clausula = clausulas.length > 0 ? `WHERE ${clausulas.join(' AND ')}` : ''

  const pagina = Math.max(1, Math.trunc(filtros.pagina ?? 1))
  const porPagina = Math.min(POR_PAGINA_MAX, Math.max(1, Math.trunc(filtros.porPagina ?? POR_PAGINA_PADRAO)))
  const exportar = filtros.exportar === true
  const ordem = filtros.cursorData !== undefined ? 'data_hora DESC, id DESC' : montarOrdemAuditoria(filtros.ordenar, filtros.direcao)

  const consultaPagina = exportar
    ? query<AuditoriaRow[]>(
        `SELECT id, data_hora, usuario_id, usuario_nome, acao, entidade, entidade_id, endereco_ip, detalhes
           FROM auditoria ${clausula}
          ORDER BY ${ordem}
          LIMIT ${TETO_EXPORTACAO}`,
        params
      )
    : query<AuditoriaRow[]>(
        `SELECT id, data_hora, usuario_id, usuario_nome, acao, entidade, entidade_id, endereco_ip, detalhes
           FROM auditoria ${clausula}
          ORDER BY ${ordem}
          LIMIT ? OFFSET ?`,
        [...params, porPagina, (pagina - 1) * porPagina]
      )

  const [linhas, agregadoRows, distintosRows] = await Promise.all([
    consultaPagina,
    filtros.semResumo
      ? Promise.resolve([] as Array<{ registros: number; ultima: Date | null }>)
      : query<Array<{ registros: number; ultima: Date | null }>>(
          `SELECT COUNT(*) AS registros, MAX(data_hora) AS ultima FROM auditoria ${clausula}`,
          params
        ),
    filtros.semResumo
      ? Promise.resolve([] as Array<{ usuarios_distintos: number }>)
      : query<Array<{ usuarios_distintos: number }>>(
          `SELECT COUNT(DISTINCT usuario_nome) AS usuarios_distintos FROM auditoria ${clausula}`,
          params
        )
  ])
  // Opções do conjunto NÃO filtrado — cache de TTL curto (RL04 M-10).
  const opcoes = filtros.semResumo ? { usuarios: [], recursos: [] } : await cacheado('auditoria-opcoes', 30_000, async () => {
    const [usuariosRows, recursosRows] = await Promise.all([
      query<Array<{ usuario_nome: string }>>('SELECT DISTINCT usuario_nome FROM auditoria ORDER BY usuario_nome ASC'),
      query<Array<{ entidade: string }>>('SELECT DISTINCT entidade FROM auditoria ORDER BY entidade ASC')
    ])
    return {
      usuarios: usuariosRows.map((r) => String(r.usuario_nome)),
      recursos: recursosRows.map((r) => String(r.entidade))
    }
  })

  const agregado = agregadoRows[0]
  const total = Number(agregado?.registros ?? 0)

  const registros: RegistroAuditoriaApi[] = linhas.map((row) => ({
    id: String(row.id),
    registradoEm: new Date(row.data_hora).toISOString(),
    usuario: { id: row.usuario_id ? String(row.usuario_id) : null, nome: String(row.usuario_nome) },
    acao: row.acao as AcaoAuditoria,
    recurso: String(row.entidade),
    detalhes: String(row.detalhes),
    ip: String(row.endereco_ip),
    entidadeId: row.entidade_id ? String(row.entidade_id) : null
  }))

  return {
    registros,
    total,
    kpis: {
      registros: total,
      usuariosDistintos: Number(distintosRows[0]?.usuarios_distintos ?? 0),
      ultimaAtividade: agregado?.ultima ? new Date(agregado.ultima).toISOString() : null
    },
    opcoes,
    pagina: exportar ? 1 : pagina,
    porPagina: exportar ? total : porPagina
  }
}
