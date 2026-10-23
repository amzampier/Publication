// Resolução do IP do cliente com lista de proxies confiáveis (IPs/CIDRs).
import ipaddr from 'ipaddr.js'

const parse = (valor: string) => {
  try {
    return ipaddr.process(valor.trim())
  } catch {
    return null
  }
}

/** `true` quando `peer` pertence a algum IP/CIDR da lista. */
export function ipConfiavel(peer: string, lista: string): boolean {
  const ip = parse(peer)
  if (!ip) return false
  for (const entrada of String(lista || '').split(',').map((item) => item.trim()).filter(Boolean)) {
    try {
      if (entrada.includes('/')) {
        const [base, bits] = ipaddr.parseCIDR(entrada)
        if (ip.kind() !== base.kind()) continue
        if (ip.match(base, bits)) return true
      } else {
        const alvo = parse(entrada)
        if (alvo && ip.kind() === alvo.kind() && ip.toNormalizedString() === alvo.toNormalizedString()) {
          return true
        }
      }
    } catch {
      // Entrada inválida é ignorada; nunca confia por acidente.
    }
  }
  return false
}

/**
 * IP da conexão; `X-Forwarded-For` só é usado quando o peer pertence à lista
 * de proxies confiáveis. Lista vazia = sempre o IP do socket.
 */
export function resolverIpCliente(event: any, lista: string): string {
  const peer = getRequestIP(event, { xForwardedFor: false }) ?? '0.0.0.0'
  if (!lista || !ipConfiavel(peer, lista)) return peer
  return getRequestIP(event, { xForwardedFor: true }) ?? peer
}