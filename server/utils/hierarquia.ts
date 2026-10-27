// Hierarquia de atribuição de perfil (RL06-M-09): um ator só pode atribuir um
// perfil cuja matriz seja subconjunto da sua, salvo quem controla perfis.
import { createError } from 'h3'
import { query } from './db'
import { carregarPermissoesDaSessao, pode } from './permission'
import { COLUNA_POR_ACAO, parseExtras } from './perfis'

type Row = Record<string, unknown>

const montarMatriz = (linhas: Row[]): Map<string, Set<string>> => {
  const mapa = new Map<string, Set<string>>()
  for (const linha of linhas) {
    const acoes = new Set<string>()
    for (const [acao, coluna] of Object.entries(COLUNA_POR_ACAO)) {
      if (Number(linha[coluna]) === 1) acoes.add(acao)
    }
    for (const extra of parseExtras(linha.extras)) acoes.add(extra)
    mapa.set(String(linha.modulo), acoes)
  }
  return mapa
}

export async function validarHierarquiaPerfil(
  event: any,
  perfil: unknown,
  perfilAtual?: unknown
): Promise<void> {
  const nomes = [
    ...new Set(
      [perfil, perfilAtual]
        .map((valor) => (typeof valor === 'string' ? valor.trim() : ''))
        .filter(Boolean)
    )
  ]
  if (!nomes.length) return

  if (
    (await pode(event, 'perfis-acesso', 'permissoes')) ||
    (await pode(event, 'perfis-acesso', 'alterar'))
  ) {
    return
  }

  const ator = await carregarPermissoesDaSessao(event)
  for (const nome of nomes) {
    const perfilRows = await query<Row[]>(
      'SELECT id FROM perfis_acesso WHERE nome_perfil = ? LIMIT 1',
      [nome]
    )
    const perfilId = String(perfilRows[0]?.id ?? '')
    if (!perfilId) continue // a validação de perfil existente fica no utilitário de usuários

    const linhas = await query<Row[]>(
      `SELECT modulo, pode_visualizar, pode_incluir, pode_editar, pode_excluir, extras
         FROM permissoes_perfil WHERE perfil_id = ?`,
      [perfilId]
    )
    const alvo = montarMatriz(linhas)
    for (const [modulo, acoes] of alvo) {
      for (const acao of acoes) {
        if (!ator.get(modulo)?.has(acao)) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Você não pode operar sobre um perfil com permissões superiores ao seu.'
          })
        }
      }
    }
  }
}