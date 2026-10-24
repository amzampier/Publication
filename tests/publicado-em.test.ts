import { describe, expect, it } from 'vitest'
import { publicadoEmFuturo, publicadoEmPara } from '../shared/publicacao'

const hoje = new Date(2026, 9, 23, 12, 0, 0)

describe('publicadoEmFuturo', () => {
  it('devolve a data agendada quando ela é futura', () => {
    expect(publicadoEmFuturo('2026-12-28', hoje)).toBe('2026-12-28 00:00:00')
  })

  it('devolve null para data passada, hoje ou ausente', () => {
    expect(publicadoEmFuturo('2026-10-22', hoje)).toBeNull()
    expect(publicadoEmFuturo('2026-10-23', hoje)).toBeNull()
    expect(publicadoEmFuturo(null, hoje)).toBeNull()
  })
})

describe('publicadoEmPara', () => {
  it('usa a data agendada quando futura', () => {
    expect(publicadoEmPara('2026-12-28', hoje)).toBe('2026-12-28 00:00:00')
  })

  it('usa o instante da transição para data passada/ausente', () => {
    expect(publicadoEmPara('2026-10-22', hoje)).toBe('2026-10-23 12:00:00')
    expect(publicadoEmPara(null, hoje)).toBe('2026-10-23 12:00:00')
  })
})
