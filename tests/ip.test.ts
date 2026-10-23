import { describe, expect, it } from 'vitest'
import { ipConfiavel } from '../server/utils/ip'

describe('proxies confiáveis', () => {
  it('aceita IPv4 exato e CIDR', () => {
    expect(ipConfiavel('10.0.0.5', '10.0.0.5')).toBe(true)
    expect(ipConfiavel('10.0.1.5', '10.0.0.0/16')).toBe(true)
    expect(ipConfiavel('10.1.0.5', '10.0.0.0/16')).toBe(false)
  })

  it('aceita IPv6 exato e CIDR', () => {
    expect(ipConfiavel('::1', '::1')).toBe(true)
    expect(ipConfiavel('2001:db8::5', '2001:db8::/32')).toBe(true)
    expect(ipConfiavel('2001:db9::5', '2001:db8::/32')).toBe(false)
  })

  it('ignora entradas inválidas e lista vazia', () => {
    expect(ipConfiavel('10.0.0.5', '')).toBe(false)
    expect(ipConfiavel('10.0.0.5', 'invalido,10.0.0.0/8')).toBe(true)
  })
})