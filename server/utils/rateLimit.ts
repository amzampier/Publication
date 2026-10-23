// server/utils/rateLimit.ts — proteção das rotas de autenticação (design D6 da
// change auth-backend-resend): janela fixa de 1 minuto por IP, em memória
// (single-node; perde o estado no restart — aceito), com limite lido de
// configuracoes_limite_requisicao (cache de 60s, default 120). 429 com
// mensagem genérica quando excedido.
import { query } from './db'
import { resolverIpCliente } from './ip'

interface Janela {
  inicio: number
  contagem: number
}

const janelas = new Map<string, Janela>()
const JANELA_MS = 60_000

let cacheLimite: { ativo: boolean; valor: number; lidoEm: number } | null = null
const CACHE_MS = 60_000

/** Zera o cache do limite — chamar após gravar um novo valor (PUT de configurações). */
export function invalidarCacheLimite(): void {
  cacheLimite = null
}

async function limitePorMinuto(): Promise<{ ativo: boolean; valor: number }> {
  const agora = Date.now()
  if (cacheLimite && agora - cacheLimite.lidoEm < CACHE_MS) {
    return { ativo: cacheLimite.ativo, valor: cacheLimite.valor }
  }

  let ativo = true
  let valor = 120
  try {
    const linhas = await query<Array<{ ativo: number; limite_requisicoes_minuto: number }>>(
      "SELECT ativo, limite_requisicoes_minuto FROM configuracoes_limite_requisicao WHERE id = 'rate_limit_default' LIMIT 1"
    )
    const linha = linhas[0]
    if (linha) {
      ativo = Number(linha.ativo) === 1
      if (Number(linha.limite_requisicoes_minuto) > 0) {
        valor = Number(linha.limite_requisicoes_minuto)
      }
    }
  } catch {
    // Banco indisponível: mantém o último/default — rate limit nunca derruba
    // a autenticação por falha de leitura da configuração.
  }
  cacheLimite = { ativo, valor, lidoEm: agora }
  return { ativo, valor }
}

/**
 * IP do cliente — RL02 A-03: usa o IP da CONEXÃO; só considera o cabeçalho
 * `X-Forwarded-For` quando TRUSTED_PROXIES está configurado (evita que um
 * cliente contorne o rate limit forjando o header).
 */
export function ipDoCliente(event: any): string {
  try {
    const confiaveis = String(useRuntimeConfig().trustedProxies || '').trim()
    return resolverIpCliente(event, confiaveis)
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
  const ip = ipDoCliente(event)
  const agora = Date.now()
  const { ativo, valor: limite } = await limitePorMinuto()

  // Status desligado: não conta nem rejeita (RL02 M-02).
  if (!ativo) return

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
