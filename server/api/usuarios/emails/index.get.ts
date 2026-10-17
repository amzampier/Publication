// GET /api/usuarios/emails — todos os e-mails da base (importação: pré-classificação
// "E-mail já cadastrado" contra a base completa — change corrigir-importacao-usuarios).
import { listarEmailsUsuarios } from '../../../utils/usuarios'
import { requirePermission } from '../../../utils/permission'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'gestao-usuarios', 'visualizar')
  const emails = await listarEmailsUsuarios()
  return { emails }
})
