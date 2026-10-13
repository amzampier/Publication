// PUT /api/configuracoes — atualização parcial das colunas editadas pela tela
import { atualizarConfiguracoes, getConfiguracoes } from '../../utils/configuracoes'

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

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum campo editável presente no corpo.' })
  }

  await atualizarConfiguracoes(patch)
  return await getConfiguracoes()
})
