// GET /api/usuarios — listagem PAGINADA no servidor (página + total + KPIs)
import { listarUsuarios } from '../../utils/usuarios'
import { funcionalidadesDeConsulta, requirePermission } from '../../utils/permission'
import { enviarCsv } from '../../utils/csv'

const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const inteiro = (v: unknown): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const exportando = texto(q.exportar) === '1' || texto(q.exportar) === 'true'
  const acoes = funcionalidadesDeConsulta({
    exportar: exportando,
    busca: Boolean(texto(q.busca)),
    filtros: Boolean(texto(q.usuario) || texto(q.perfil) || texto(q.status))
  })
  for (const acao of acoes) await requirePermission(event, 'gestao-usuarios', acao)
  if (exportando && texto(q.formato) === 'csv') {
    const cabecalho = ['Nome', 'E-mail', 'Perfil', 'Status', 'Último acesso']
    return enviarCsv(event, 'usuarios.csv', cabecalho, (async function* () {
      let pagina = 1
      while (true) {
        const lote = await listarUsuarios({
          usuario: texto(q.usuario),
          perfil: texto(q.perfil),
          status: texto(q.status),
          busca: texto(q.busca),
          pagina,
          porPagina: 200,
          ordenar: texto(q.ordenar),
          direcao: texto(q.direcao)
        })
        for (const u of lote.usuarios) {
          yield [u.nome, u.email, u.perfil, u.status, u.ultimoAcesso ?? '']
        }
        if (lote.usuarios.length < 200) return
        pagina += 1
      }
    })())
  }
  return await listarUsuarios({
    usuario: texto(q.usuario),
    perfil: texto(q.perfil),
    status: texto(q.status),
    busca: texto(q.busca),
    pagina: inteiro(q.pagina),
    porPagina: inteiro(q.porPagina),
    exportar: exportando,
    ordenar: texto(q.ordenar),
    direcao: texto(q.direcao)
  })
})
