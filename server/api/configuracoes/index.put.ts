// PUT /api/configuracoes — atualização parcial das colunas editadas pela tela
import { atualizarConfiguracoes, getConfiguracoes } from '../../utils/configuracoes'
import { invalidarCacheLimite } from '../../utils/rateLimit'
import { registrarAuditoria } from '../../utils/audit'

const CHAVES_SIDEBAR = ['publicacoes', 'movimentos', 'cadastros', 'administracao']

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  const patch: {
    dias_retencao_auditoria?: number
    logo_header_url?: string | null
    logo_login_url?: string | null
    sidebar_grupos?: Record<string, boolean>
    sidebar_expandida?: boolean
    rate_limit?: { ativo: boolean; limite_requisicoes_minuto: number }
  } = {}

  if ('dias_retencao_auditoria' in body) {
    const valor = body.dias_retencao_auditoria
    if (!Number.isInteger(valor) || (valor as number) < 30 || (valor as number) > 730) {
      throw createError({ statusCode: 400, statusMessage: 'dias_retencao_auditoria deve ser inteiro entre 30 e 730.' })
    }
    patch.dias_retencao_auditoria = valor as number
  }

  for (const campo of ['logo_header_url', 'logo_login_url'] as const) {
    if (campo in body) {
      const valor = body[campo]
      if (valor !== null && (typeof valor !== 'string' || valor.length > 500)) {
        throw createError({ statusCode: 400, statusMessage: `${campo} deve ser string de até 500 caracteres (ou null).` })
      }
      patch[campo] = valor as string | null
    }
  }

  if ('sidebar_grupos' in body) {
    const valor = body.sidebar_grupos
    const valido =
      valor &&
      typeof valor === 'object' &&
      !Array.isArray(valor) &&
      CHAVES_SIDEBAR.every((chave) => typeof (valor as Record<string, unknown>)[chave] === 'boolean')
    if (!valido) {
      throw createError({
        statusCode: 400,
        statusMessage: `sidebar_grupos deve ser objeto com booleanos em: ${CHAVES_SIDEBAR.join(', ')}.`
      })
    }
    patch.sidebar_grupos = valor as Record<string, boolean>
  }

  if ('sidebar_expandida' in body) {
    if (typeof body.sidebar_expandida !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'sidebar_expandida deve ser booleano (true/false).' })
    }
    patch.sidebar_expandida = body.sidebar_expandida
  }

  if ('rate_limit' in body) {
    const valor = body.rate_limit as { ativo?: unknown; limite_requisicoes_minuto?: unknown } | null
    const valido =
      valor &&
      typeof valor === 'object' &&
      typeof valor.ativo === 'boolean' &&
      Number.isInteger(valor.limite_requisicoes_minuto) &&
      (valor.limite_requisicoes_minuto as number) >= 1
    if (!valido) {
      throw createError({
        statusCode: 400,
        statusMessage: 'rate_limit deve ser { ativo: boolean, limite_requisicoes_minuto: inteiro >= 1 }.'
      })
    }
    patch.rate_limit = {
      ativo: valor.ativo as boolean,
      limite_requisicoes_minuto: valor.limite_requisicoes_minuto as number
    }
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum campo editável presente no corpo.' })
  }

  await atualizarConfiguracoes(patch)
  // Limite novo vale imediatamente — sem esperar o cache de 60s expirar
  if (patch.rate_limit) invalidarCacheLimite()
  await registrarAuditoria(event, {
    acao: 'Alteração',
    recurso: 'Configurações Globais',
    detalhes: `Atualizou as configurações: ${Object.keys(patch).join(', ')}`
  })
  return await getConfiguracoes()
})
