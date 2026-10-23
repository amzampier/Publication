import { createError, setResponseHeader, setResponseStatus } from 'h3'
import { getSessionUser } from '../../utils/auth'
import { obterPainelExecutivo, type EscopoPainel } from '../../utils/painel-executivo'
import { pode } from '../../utils/permission'
import { ehSaturacaoDePool } from '../../utils/pool-error'

/**
 * GET /api/painel-executivo?ano=AAAA — agregação do ciclo editorial.
 * Sessão obrigatória e RBAC por bloco: o perfil precisa de `visualizar` em ao
 * menos um dos módulos agregados; cada bloco exige o módulo de origem.
 */
export default defineEventHandler(async (event) => {
  const sessao = await getSessionUser(event)
  if (!sessao) {
    throw createError({ statusCode: 401, statusMessage: 'Sem sessão ativa.' })
  }

  const [releases, manuais, escopos, chamadas, softwares, parceiros] = await Promise.all([
    pode(event, 'release-week', 'visualizar'),
    pode(event, 'manuais', 'visualizar'),
    pode(event, 'escopo-projetos', 'visualizar'),
    pode(event, 'lancar-chamadas', 'visualizar'),
    pode(event, 'softwares', 'visualizar'),
    pode(event, 'parceiros', 'visualizar')
  ])

  const escopo: EscopoPainel = {
    releases,
    manuais,
    escopos,
    chamadas,
    softwares,
    parceiros
  }
  if (!releases && !manuais && !escopos && !chamadas && !softwares && !parceiros) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Você não tem permissão para visualizar o Painel Executivo.'
    })
  }

  const bruto = String(getQuery(event).ano ?? '').trim()
  const ano = bruto ? Number(bruto) : undefined
  if (bruto && (!/^\d{4}$/.test(bruto) || ano === undefined || ano < 1900 || ano > 2999)) {
    throw createError({ statusCode: 400, statusMessage: 'Ano inválido. Use quatro dígitos (AAAA).' })
  }

  try {
    return await obterPainelExecutivo(ano, escopo)
  } catch (erro) {
    if (!ehSaturacaoDePool(erro)) throw erro
    setResponseStatus(event, 503)
    setResponseHeader(event, 'Retry-After', 2)
    return { message: 'Serviço temporariamente indisponível. Tente novamente em instantes.' }
  }
})
