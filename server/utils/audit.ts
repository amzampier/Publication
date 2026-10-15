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
import { query } from './db'
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
}

export interface FiltrosAuditoriaApi {
  /** 'yyyy-mm-dd' (dia local); vazio/ausente = sem limite */
  dataInicial?: string
  dataFinal?: string
  /** nome do operador (usuario_nome) */
  usuario?: string
  acao?: string
  recurso?: string
}

export interface RespostaAuditoria {
  registros: RegistroAuditoriaApi[]
  /** Conjunto NÃO filtrado — opções dos selects de filtro nunca somem */
  opcoes: { usuarios: string[]; recursos: string[] }
}

/** Formato de data aceito nos filtros; qualquer outra coisa é ignorada. */
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/

interface AuditoriaRow {
  id: string
  data_hora: Date
  usuario_id: string | null
  usuario_nome: string
  acao: string
  entidade: string
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
        registro.detalhes.slice(0, 16_000_000)
      ]
    )
  } catch (erro) {
    console.error('[auditoria] Falha ao registrar evento de auditoria:', erro)
  }
}

/**
 * Lista os registros para a tela /admin/auditoria (GET /api/auditoria).
 * Filtros estruturais no servidor; datas como janela inclusiva do dia;
 * ordenação do mais recente para o mais antigo; `opcoes` sempre do
 * conjunto completo (regra das demais telas: opção não some por filtro).
 */
export async function listarAuditoria(filtros: FiltrosAuditoriaApi): Promise<RespostaAuditoria> {
  const clausulas: string[] = []
  const params: unknown[] = []

  const dataInicial = (filtros.dataInicial ?? '').trim()
  if (DATA_ISO.test(dataInicial)) {
    clausulas.push('data_hora >= ?')
    params.push(`${dataInicial} 00:00:00`)
  }
  const dataFinal = (filtros.dataFinal ?? '').trim()
  if (DATA_ISO.test(dataFinal)) {
    clausulas.push('data_hora <= ?')
    params.push(`${dataFinal} 23:59:59`)
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

  const clausula = clausulas.length > 0 ? `WHERE ${clausulas.join(' AND ')}` : ''

  const [linhas, usuariosRows, recursosRows] = await Promise.all([
    query<AuditoriaRow[]>(
      `SELECT id, data_hora, usuario_id, usuario_nome, acao, entidade, endereco_ip, detalhes
         FROM auditoria ${clausula}
        ORDER BY data_hora DESC, id DESC`,
      params
    ),
    query<Array<{ usuario_nome: string }>>(
      'SELECT DISTINCT usuario_nome FROM auditoria ORDER BY usuario_nome ASC'
    ),
    query<Array<{ entidade: string }>>(
      'SELECT DISTINCT entidade FROM auditoria ORDER BY entidade ASC'
    )
  ])

  const registros: RegistroAuditoriaApi[] = linhas.map((row) => ({
    id: String(row.id),
    registradoEm: new Date(row.data_hora).toISOString(),
    usuario: { id: row.usuario_id ? String(row.usuario_id) : null, nome: String(row.usuario_nome) },
    acao: row.acao as AcaoAuditoria,
    recurso: String(row.entidade),
    detalhes: String(row.detalhes),
    ip: String(row.endereco_ip)
  }))

  return {
    registros,
    opcoes: {
      usuarios: usuariosRows.map((r) => String(r.usuario_nome)),
      recursos: recursosRows.map((r) => String(r.entidade))
    }
  }
}
