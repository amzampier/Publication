// GET /api/seguranca/estado — constantes, contas em estado de segurança e
// últimos eventos de login (aba Segurança; sessão exigida pelo middleware)
import { listarEstadoSeguranca } from '../../../utils/seguranca'

export default defineEventHandler(async () => {
  return await listarEstadoSeguranca()
})
