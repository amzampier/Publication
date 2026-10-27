import { describe, expect, it } from 'vitest'
import {
  caminhoIsentoCsrf,
  metodoExigeCsrf,
  origemConfiavel,
  tokenCsrfValido
} from '../server/utils/csrf'
import { cspPara, headersSeguranca } from '../server/utils/security-headers'

describe('CSRF', () => {
  it('isenta autenticação e exige token em escrita', () => {
    expect(caminhoIsentoCsrf('/api/auth/login')).toBe(true)
    expect(caminhoIsentoCsrf('/api/usuarios')).toBe(false)
    expect(metodoExigeCsrf('GET')).toBe(false)
    expect(metodoExigeCsrf('POST')).toBe(true)
  })

  it('aceita mesma origem e token de duplo envio', () => {
    expect(origemConfiavel('http://localhost:3000', 'http://localhost:3000', 'http', 'localhost:3000')).toBe(true)
    expect(origemConfiavel('https://malicioso.test', 'http://localhost:3000', 'http', 'localhost:3000')).toBe(false)
    expect(tokenCsrfValido('abc', 'abc')).toBe(true)
    expect(tokenCsrfValido('abc', 'abd')).toBe(false)
  })
})

describe('headers de segurança', () => {
  it('inclui headers globais e CSP compatível com o kit', () => {
    const headers = headersSeguranca('/admin', false, false)
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Content-Security-Policy']).toContain("style-src 'self' 'unsafe-inline'")
    expect(headers['Strict-Transport-Security']).toBeUndefined()
  })

  it('HSTS só em produção HTTPS e CSP restrita para uploads', () => {
    expect(headersSeguranca('/admin', true, true)['Strict-Transport-Security']).toBeDefined()
    expect(cspPara('/uploads/chamadas/2026/10/a.png', true)).toBe("default-src 'none'; sandbox")
  })

  it('libera ViaCEP e Google Fonts sem abrir hosts arbitrários', () => {
    for (const producao of [false, true]) {
      const csp = cspPara('/admin', producao)
      expect(csp).toContain("connect-src 'self' https://viacep.com.br")
      expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com")
      expect(csp).toContain("font-src 'self' https://fonts.gstatic.com data:")
      expect(csp).not.toContain('connect-src *')
    }
    expect(cspPara('/admin', false)).toContain('ws: wss:')
    expect(cspPara('/admin', true)).not.toContain('ws: wss:')
  })
})