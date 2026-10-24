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
let chamadasLimpeza = 0
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
function consumirMemoria(chave: string): number {
  const agora = Date.now()
  if (janelas.size > 500) {
    for (const [k, j] of janelas) {
      if (agora - j.inicio >= JANELA_MS) janelas.delete(k)
    }
  }
  let janela = janelas.get(chave)
  if (!janela || agora - janela.inicio >= JANELA_MS) {
    janela = { inicio: agora, contagem: 0 }
    janelas.set(chave, janela)
  }
  janela.contagem += 1
  return janela.contagem
}

async function consumirBanco(chave: string): Promise<number | null> {
  try {
    await query(
      `INSERT INTO rate_limit_contadores (chave, janela_inicio, contagem, atualizado_em)
       VALUES (?, DATE_FORMAT(NOW(6), '%Y-%m-%d %H:%i:00'), 1, NOW(6))
       ON DUPLICATE KEY UPDATE
         contagem = IF(
           janela_inicio < DATE_FORMAT(NOW(6), '%Y-%m-%d %H:%i:00'),
           1,
           contagem + 1
         ),
         janela_inicio = IF(
           janela_inicio < DATE_FORMAT(NOW(6), '%Y-%m-%d %H:%i:00'),
           DATE_FORMAT(NOW(6), '%Y-%m-%d %H:%i:00'),
           janela_inicio
         ),
         atualizado_em = NOW(6)`,
      [chave]
    )
    const linhas = await query<Array<{ contagem: number }>>(
      'SELECT contagem FROM rate_limit_contadores WHERE chave = ? LIMIT 1',
      [chave]
    )
    return Number(linhas[0]?.contagem ?? 0)
  } catch {
    return null
  }
}

async function limparAntigos(): Promise<void> {
  chamadasLimpeza += 1
  if (chamadasLimpeza % 100 !== 0) return
  try {
    await query(
      "DELETE FROM rate_limit_contadores WHERE atualizado_em < DATE_SUB(NOW(6), INTERVAL 1 DAY)"
    )
  } catch {
    // limpeza é best-effort; não afeta o limite
  }
}

export async function exigirRateLimit(event: any): Promise<void> {
  const ip = ipDoCliente(event)
  const rota = String(event?.path ?? '').split('?')[0] || 'desconhecida'
  const chave = `${ip}|${rota}`.slice(0, 255)
  const { ativo, valor: limite } = await limitePorMinuto()

  // Status desligado: não conta nem rejeita (RL02 M-02).
  if (!ativo) return

  const persistido = await consumirBanco(chave)
  const contagem = persistido ?? consumirMemoria(chave)
  void limparAntigos()

  if (contagem > limite) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Muitas tentativas. Aguarde um minuto e tente novamente.'
    })
  }
}
