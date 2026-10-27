// Consulta paginada de um catÃ¡logo de LanÃ§ar as Chamadas. Alimenta os selects
// remotos: a lista completa nÃ£o precisa mais ir ao cliente em cada pÃ¡gina.
import { cacheado } from './cache'
import { query } from './db'
import { escaparLike } from './sql'
import type {
  OpcaoChamada,
  OpcoesCatalogoChamada,
  TipoCatalogoChamada
} from '#shared/lancar-chamadas'

type Row = Record<string, unknown>

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor).trim()

const dataDia = (valor: unknown): string => {
  if (valor instanceof Date) {
    const ano = valor.getFullYear()
    const mes = String(valor.getMonth() + 1).padStart(2, '0')
    const dia = String(valor.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  return texto(valor).slice(0, 10)
}

interface ConfigCatalogo {
  tabela: string
  colunas: string
  camposBusca: string[]
  whereBase: string[]
  ordem: string
  mapear: (row: Row) => OpcaoChamada
}

const CONFIG: Record<TipoCatalogoChamada, ConfigCatalogo> = {
  releases: {
    tabela: 'release_week',
    colunas: 'id, codigo, nome, data_publicacao, status',
    camposBusca: ['codigo', 'nome'],
    whereBase: ['arquivada = 0'],
    ordem: 'data_publicacao DESC, codigo DESC',
    mapear: (row) => ({
      id: texto(row.id),
      label: `${texto(row.codigo)} - ${texto(row.nome)}`,
      sigla: texto(row.codigo),
      dataPublicacao: dataDia(row.data_publicacao),
      status: texto(row.status)
    })
  },
  projetos: {
    tabela: 'projetos_escopo',
    colunas: 'id, codigo, nome, status',
    camposBusca: ['codigo', 'nome'],
    whereBase: ['arquivada = 0'],
    ordem: 'ano DESC, versao DESC, codigo ASC',
    mapear: (row) => ({
      id: texto(row.id),
      label: `${texto(row.codigo)} - ${texto(row.nome)}`,
      sigla: texto(row.codigo),
      status: texto(row.status)
    })
  },
  manuais: {
    tabela: 'manuais_mensal',
    colunas: 'id, codigo, titulo, status',
    camposBusca: ['codigo', 'titulo'],
    whereBase: ['arquivada = 0'],
    ordem: 'ano DESC, mes_numero DESC',
    mapear: (row) => ({
      id: texto(row.id),
      label: `${texto(row.codigo)} - ${texto(row.titulo)}`,
      sigla: texto(row.codigo),
      status: texto(row.status)
    })
  },
  softwares: {
    tabela: 'softwares',
    colunas: 'codigo, descricao',
    camposBusca: ['codigo', 'descricao'],
    whereBase: ["situacao = 'Ativo'"],
    ordem: 'descricao ASC',
    mapear: (row) => ({
      id: texto(row.codigo),
      label: texto(row.descricao),
      sigla: texto(row.codigo)
    })
  },
  parceiros: {
    tabela: 'parceiros',
    colunas: 'id, codigo, nome_fantasia',
    camposBusca: ['codigo', 'nome_fantasia', 'razao_social'],
    whereBase: ["situacao = 'Ativo'"],
    ordem: 'nome_fantasia ASC',
    mapear: (row) => ({
      id: texto(row.id),
      label: texto(row.nome_fantasia),
      sigla: texto(row.codigo)
    })
  }
}

/** Limite padrÃ£o 20, teto 50; valores invÃ¡lidos caem no padrÃ£o. */
export function normalizarLimite(valor: unknown): number {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) return 20
  return Math.min(Math.max(Math.trunc(numero), 1), 50)
}

export function normalizarBusca(valor: unknown): string {
  return texto(valor).slice(0, 80)
}

export function normalizarPagina(valor: unknown): number {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) return 1
  return Math.trunc(numero)
}

async function consultarCatalogo(
  tipo: TipoCatalogoChamada,
  termo: string,
  limite: number,
  pagina: number
): Promise<OpcoesCatalogoChamada> {
  const config = CONFIG[tipo]
  const where = [...config.whereBase]
  const params: unknown[] = []

  if (termo) {
    const like = `%${escaparLike(termo)}%`
    where.push(`(${config.camposBusca.map((campo) => `${campo} LIKE ?`).join(' OR ')})`)
    for (const _campo of config.camposBusca) params.push(like)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const deslocamento = (pagina - 1) * limite
  const [linhas, totalRows] = await Promise.all([
    query<Row[]>(
      `SELECT ${config.colunas}
         FROM ${config.tabela}
        ${whereSql}
        ORDER BY ${config.ordem}
        LIMIT ? OFFSET ?`,
      [...params, limite + 1, deslocamento]
    ),
    query<Row[]>(`SELECT COUNT(*) AS total FROM ${config.tabela} ${whereSql}`, params)
  ])

  const hasMore = linhas.length > limite
  const itens = linhas.slice(0, limite).map(config.mapear)
  const total = Number(totalRows[0]?.total ?? itens.length)

  return { itens, total, hasMore }
}

export function listarOpcoesPorTipo(
  tipo: TipoCatalogoChamada,
  busca: string,
  limite: unknown,
  pagina: unknown = 1
): Promise<OpcoesCatalogoChamada> {
  const termo = normalizarBusca(busca)
  const tamanho = normalizarLimite(limite)
  const numeroPagina = normalizarPagina(pagina)
  const consultar = () => consultarCatalogo(tipo, termo, tamanho, numeroPagina)
  if (!termo && numeroPagina === 1) {
    return cacheado(`opcoes-chamada:${tipo}:${tamanho}`, 30_000, consultar)
  }
  return consultar()
}
