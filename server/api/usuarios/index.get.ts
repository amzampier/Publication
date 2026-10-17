// GET /api/usuarios — listagem PAGINADA no servidor (página + total + KPIs)
import { listarUsuarios } from '../../utils/usuarios'
import { requirePermission } from '../../utils/permission'

const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const inteiro = (v: unknown): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'gestao-usuarios', 'visualizar')
  const q = getQuery(event)
  return await listarUsuarios({
    usuario: texto(q.usuario),
    perfil: texto(q.perfil),
    status: texto(q.status),
    busca: texto(q.busca),
    pagina: inteiro(q.pagina),
    porPagina: inteiro(q.porPagina),
    exportar: texto(q.exportar) === '1' || texto(q.exportar) === 'true',
    ordenar: texto(q.ordenar),
    direcao: texto(q.direcao)
  })
})
