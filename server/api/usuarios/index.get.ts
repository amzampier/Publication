// GET /api/usuarios — lista completa sem senha (middleware de sessão exige login)
import { listarUsuarios } from '../../utils/usuarios'

export default defineEventHandler(async () => {
  return await listarUsuarios()
})
