// server/utils/cache.ts — cache em memória de TTL curto (RL04-M-10/M-14).
// Usado para as opções de filtro (conjunto NÃO filtrado, mudam raramente),
// evitando os DISTINCT a cada listagem. Um servidor de longa duração mantém o
// Map; não há invalidação explícita — a janela do TTL limita a defasagem.
interface EntradaCache<T> {
  valor: T
  expira: number
}

const store = new Map<string, EntradaCache<unknown>>()
const pendentes = new Map<string, Promise<unknown>>()

/** Invalida chaves específicas (ou todo o cache) após escritas (RL05-M-07). */
export function invalidarCache(...chaves: string[]): void {
  if (chaves.length === 0) {
    store.clear()
    pendentes.clear()
    return
  }
  for (const chave of chaves) {
    store.delete(chave)
    pendentes.delete(chave)
  }
}

/**
 * Devolve o valor do cache quando dentro do TTL; senão produz, guarda e devolve.
 * A produção não é deduplicada por chamada (basta para o uso atual).
 */
export async function cacheado<T>(chave: string, ttlMs: number, produzir: () => Promise<T>): Promise<T> {
  const agora = Date.now()
  const atual = store.get(chave) as EntradaCache<T> | undefined
  if (atual && atual.expira > agora) return atual.valor
  const emVoo = pendentes.get(chave)
  if (emVoo) return emVoo as Promise<T>
  const promessa = produzir()
    .then((valor) => {
      store.set(chave, { valor, expira: Date.now() + ttlMs })
      return valor
    })
    .finally(() => {
      pendentes.delete(chave)
    })
  pendentes.set(chave, promessa)
  return promessa
}