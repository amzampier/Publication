// GET /api/usuarios/emails?q=... - autocomplete dedicado (RL06 segurança/infra).
import { buscarEmailsUsuarios } from '../../utils/usuarios'
import { requirePermission } from '../../utils/permission'

const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const inteiro = (v: unknown): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined
}

export default defineEventHandler(async (event) => {
  const q = texto(getQuery(event).q)
  if (q.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe ao menos 2 caracteres para buscar e-mails.'
    })
  }
  await requirePermission(event, 'gestao-usuarios', 'visualizar')
  await requirePermission(event, 'gestao-usuarios', 'buscar')
  const consulta = getQuery(event)
  return await buscarEmailsUsuarios(
    q,
    inteiro(consulta.pagina) ?? 1,
    inteiro(consulta.porPagina) ?? 10
  )
})
