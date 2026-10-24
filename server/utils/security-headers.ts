export interface HeadersSeguranca {
  'X-Content-Type-Options': string
  'Referrer-Policy': string
  'Permissions-Policy': string
  'X-Frame-Options': string
  'Content-Security-Policy': string
  'Strict-Transport-Security'?: string
}

export function cspPara(caminho: string, producao: boolean): string {
  if (caminho.startsWith('/uploads/')) return "default-src 'none'; sandbox"
  const script = producao
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  const connect = producao ? "connect-src 'self'" : "connect-src 'self' ws: wss:"
  return [
    "default-src 'self'",
    script,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' https://fonts.gstatic.com data:",
    connect,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}

export function headersSeguranca(
  caminho: string,
  producao: boolean,
  seguro: boolean
): HeadersSeguranca {
  const headers: HeadersSeguranca = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': cspPara(caminho, producao)
  }
  if (producao && seguro) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
  }
  return headers
}
