// server/utils/rateLimit.ts — proteção das rotas de autenticação (design D6 da
// change auth-backend-resend): janela fixa de 1 minuto por IP, em memória
// (single-node; perde o estado no restart — aceito), com limite lido de
// configuracoes_limite_requisicao (cache de 60s, default 120). 429 com
// mensagem genérica quando excedido.
import { query } from './db'

interface Janela {
  inicio: number
  contagem: number
}

const janelas = new Map<string, Janela>()
const JANELA_MS = 60_000

let cacheLimite: { valor: number; lidoEm: number } | null = null
const CACHE_MS = 60_000

async function limitePorMinuto(): Promise<number> {
  const agora = Date.now()
  if (cacheLimite && agora - cacheLimite.lidoEm < CACHE_MS) return cacheLimite.valor

  let valor = 120
  try {
    const linhas = await query<Array<{ limite_requisicoes_minuto: number }>>(
      "SELECT limite_requisicoes_minuto FROM configuracoes_limite_requisicao WHERE id = 'rate_limit_default' LIMIT 1"
    )
    if (linhas.length > 0 && Number(linhas[0].limite_requisicoes_minuto) > 0) {
      valor = Number(linhas[0].limite_requisicoes_minuto)
    }
  } catch {
    // Banco indisponível: mantém o último/default — rate limit nunca derruba
    // a autenticação por falha de leitura da configuração.
  }
  cacheLimite = { valor, lidoEm: agora }
  return valor
}

function ipDe(event: any): string {
  try {
    return getRequestIP(event, { xForwardedFor: true }) ?? '0.0.0.0'
  } catch {
    return '0.0.0.0'
  }
}

/**
 * Conta a requisição no bucket do IP e lança 429 quando o minuto corrente
 * exceder o limite configurado. Chamar no início das rotas de auth
 * (login, refresh, esqueci-senha, trocar-senha, convite).
 */
export async function exigirRateLimit(event: any): Promise<void> {
  const ip = ipDe(event)
  const agora = Date.now()
  const limite = await limitePorMinuto()

  // Varredura oportunista de janelas vencidas (map pequeno: single-node).
  if (janelas.size > 500) {
    for (const [chave, j] of janelas) {
      if (agora - j.inicio >= JANELA_MS) janelas.delete(chave)
    }
  }

  let janela = janelas.get(ip)
  if (!janela || agora - janela.inicio >= JANELA_MS) {
    janela = { inicio: agora, contagem: 0 }
    janelas.set(ip, janela)
  }
  janela.contagem += 1

  if (janela.contagem > limite) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Muitas tentativas. Aguarde um minuto e tente novamente.'
    })
  }
}
