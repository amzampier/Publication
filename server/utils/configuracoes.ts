// server/utils/configuracoes.ts — acesso à linha única de configurações globais
// Tabela: configuracoes_globais (id = 'config_default', seedada em 02_seed.sql).
import { query, getTransaction } from './db'

export interface ConfiguracoesGlobais {
  id: string
  nome_empresa: string
  banner_publico_ativo: number
  banner_texto: string | null
  banner_tipo: 'info' | 'alerta' | 'novidade'
  exigir_revisao_para_publicar: number
  notificar_por_email: number
  sidebar_grupos: Record<string, boolean>
  /** 1 = sidebar do shell expandida, 0 = recolhida (migration 03). */
  sidebar_expandida: boolean
  logo_header_url: string | null
  logo_login_url: string | null
  dias_retencao_auditoria: number
  /** Linha configuracoes_limite_requisicao ('rate_limit_default') — aba Segurança. */
  rate_limit: {
    ativo: boolean
    limite_requisicoes_minuto: number
  }
}

export interface PatchConfiguracoes {
  dias_retencao_auditoria?: number
  logo_header_url?: string | null
  logo_login_url?: string | null
  sidebar_grupos?: Record<string, boolean>
  sidebar_expandida?: boolean
  rate_limit?: {
    ativo: boolean
    limite_requisicoes_minuto: number
  }
}

/** Fallback do rate limit quando a linha do seed está ausente. */
const RATE_PADRAO = { ativo: true, limite_requisicoes_minuto: 120 }

// Fallback quando a linha do banco está ausente — espelha o seed de 02_seed.sql.
const CONFIG_PADRAO: Omit<ConfiguracoesGlobais, 'criado_em' | 'atualizado_em'> = {
  id: 'config_default',
  nome_empresa: 'Publication Enterprise Suite',
  banner_publico_ativo: 1,
  banner_texto: null,
  banner_tipo: 'novidade',
  exigir_revisao_para_publicar: 1,
  notificar_por_email: 0,
  sidebar_grupos: { publicacoes: true, movimentos: true, cadastros: true, administracao: true },
  sidebar_expandida: true,
  logo_header_url: null,
  logo_login_url: null,
  dias_retencao_auditoria: 180
}

type RowConfig = Record<string, unknown>

const normalizarRow = (row: RowConfig): Omit<ConfiguracoesGlobais, 'rate_limit'> => {
  let grupos = row.sidebar_grupos
  if (typeof grupos === 'string') {
    try {
      grupos = JSON.parse(grupos)
    } catch {
      grupos = CONFIG_PADRAO.sidebar_grupos
    }
  }
  if (!grupos || typeof grupos !== 'object') grupos = CONFIG_PADRAO.sidebar_grupos
  return {
    id: String(row.id ?? CONFIG_PADRAO.id),
    nome_empresa: String(row.nome_empresa ?? CONFIG_PADRAO.nome_empresa),
    banner_publico_ativo: Number(row.banner_publico_ativo ?? CONFIG_PADRAO.banner_publico_ativo),
    banner_texto: (row.banner_texto as string | null) ?? null,
    banner_tipo: (row.banner_tipo as ConfiguracoesGlobais['banner_tipo']) ?? CONFIG_PADRAO.banner_tipo,
    exigir_revisao_para_publicar: Number(row.exigir_revisao_para_publicar ?? CONFIG_PADRAO.exigir_revisao_para_publicar),
    notificar_por_email: Number(row.notificar_por_email ?? CONFIG_PADRAO.notificar_por_email),
    sidebar_grupos: grupos as Record<string, boolean>,
    sidebar_expandida: row.sidebar_expandida === undefined ? true : Number(row.sidebar_expandida) === 1,
    logo_header_url: (row.logo_header_url as string | null) ?? null,
    logo_login_url: (row.logo_login_url as string | null) ?? null,
    dias_retencao_auditoria: Number(row.dias_retencao_auditoria ?? CONFIG_PADRAO.dias_retencao_auditoria)
  }
}

/** Lê a linha config_default completa (fallback = defaults do seed). */
export async function getConfiguracoes(): Promise<ConfiguracoesGlobais> {
  const [rows, rateRows] = await Promise.all([
    query<RowConfig[]>("SELECT * FROM configuracoes_globais WHERE id = 'config_default'"),
    query<Array<{ ativo: number; limite_requisicoes_minuto: number }>>(
      "SELECT ativo, limite_requisicoes_minuto FROM configuracoes_limite_requisicao WHERE id = 'rate_limit_default' LIMIT 1"
    )
  ])
  const base = rows.length === 0
    ? { ...CONFIG_PADRAO, sidebar_grupos: { ...CONFIG_PADRAO.sidebar_grupos } }
    : normalizarRow(rows[0])
  const rate = rateRows.length > 0
    ? {
        ativo: Number(rateRows[0].ativo) === 1,
        limite_requisicoes_minuto: Number(rateRows[0].limite_requisicoes_minuto) || RATE_PADRAO.limite_requisicoes_minuto
      }
    : { ...RATE_PADRAO }
  return { ...base, rate_limit: rate }
}

/**
 * Atualização parcial: só as colunas presentes no patch são alteradas —
 * campos sem UI hoje (banner_*, nome_empresa...) jamais são sobrescritos.
 */
export async function atualizarConfiguracoes(patch: PatchConfiguracoes): Promise<void> {
  const colunas: string[] = []
  const valores: unknown[] = []
  if (patch.dias_retencao_auditoria !== undefined) {
    colunas.push('dias_retencao_auditoria = ?')
    valores.push(patch.dias_retencao_auditoria)
  }
  if (patch.logo_header_url !== undefined) {
    colunas.push('logo_header_url = ?')
    valores.push(patch.logo_header_url === '' ? null : patch.logo_header_url)
  }
  if (patch.logo_login_url !== undefined) {
    colunas.push('logo_login_url = ?')
    valores.push(patch.logo_login_url === '' ? null : patch.logo_login_url)
  }
  if (patch.sidebar_grupos !== undefined) {
    colunas.push('sidebar_grupos = ?')
    valores.push(JSON.stringify(patch.sidebar_grupos))
  }
  if (patch.sidebar_expandida !== undefined) {
    colunas.push('sidebar_expandida = ?')
    valores.push(patch.sidebar_expandida ? 1 : 0)
  }
  if (colunas.length === 0 && patch.rate_limit === undefined) return
  // Atômico entre as duas tabelas (change endurecer-banco-e-bootstrap, RL02 M-11):
  // ou ambas as superfícies são gravadas, ou nenhuma — sem estado parcial.
  const tx = await getTransaction()
  try {
    if (colunas.length > 0) {
      await tx.query(`UPDATE configuracoes_globais SET ${colunas.join(', ')} WHERE id = 'config_default'`, valores)
    }
    // Rate limit vive em outra tabela ('rate_limit_default', seedada em 02_seed.sql)
    if (patch.rate_limit !== undefined) {
      const rate = patch.rate_limit
      await tx.query(
        `INSERT INTO configuracoes_limite_requisicao (id, ativo, limite_requisicoes_minuto)
         VALUES ('rate_limit_default', ?, ?)
         ON DUPLICATE KEY UPDATE ativo = VALUES(ativo), limite_requisicoes_minuto = VALUES(limite_requisicoes_minuto)`,
        [rate.ativo ? 1 : 0, rate.limite_requisicoes_minuto]
      )
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    throw erro
  }
}
