import { createError } from 'h3'
import { getSessionUser } from '../../utils/auth'
import { obterPainelExecutivo } from '../../utils/painel-executivo'

/**
 * GET /api/painel-executivo?ano=AAAA — agregação do ciclo editorial.
 * Sessão obrigatória (middleware global + checagem explícita); sem novo módulo
 * RBAC. Ano ausente = corrente; ano fora de quatro dígitos = 400.
 */
export default defineEventHandler(async (event) => {
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }

  const bruto = String(getQuery(event).ano ?? '').trim()
  const ano = bruto ? Number(bruto) : undefined
  if (bruto && (!/^\d{4}$/.test(bruto) || ano === undefined || ano < 1900 || ano > 2999)) {
    throw createError({ statusCode: 400, statusMessage: 'Ano inválido. Use quatro dígitos (AAAA).' })
  }

  return await obterPainelExecutivo(ano)
})
