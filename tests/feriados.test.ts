import { describe, it, expect } from 'vitest'
import {
  dataPublicacaoValida,
  ehDiaUtil,
  ehFeriadoNacional,
  proximoDiaUtil,
  segundaDaSemana
} from '../shared/feriados'

describe('calendário de feriados nacionais', () => {
  it('reconhece feriados fixos', () => {
    expect(ehFeriadoNacional('2026-01-01')).toBe(true)
    expect(ehFeriadoNacional('2026-11-02')).toBe(true) // Finados
    expect(ehFeriadoNacional('2026-12-25')).toBe(true)
  })

  it('reconhece feriados móveis de 2026', () => {
    expect(ehFeriadoNacional('2026-02-16')).toBe(true) // Carnaval segunda
    expect(ehFeriadoNacional('2026-02-17')).toBe(true) // Carnaval terça
    expect(ehFeriadoNacional('2026-04-03')).toBe(true) // Sexta-feira Santa
    expect(ehFeriadoNacional('2026-06-04')).toBe(true) // Corpus Christi
  })

  it('considera dia útil apenas segunda a sexta fora dos feriados', () => {
    expect(ehDiaUtil('2026-10-05')).toBe(true) // segunda
    expect(ehDiaUtil('2026-10-06')).toBe(true) // terça
    expect(ehDiaUtil('2026-10-10')).toBe(false) // sábado
    expect(ehDiaUtil('2026-11-02')).toBe(false) // Finados
  })

  it('calcula o próximo dia útil e a segunda da semana', () => {
    expect(proximoDiaUtil('2026-11-02')).toBe('2026-11-03')
    expect(proximoDiaUtil('2026-02-16')).toBe('2026-02-18') // Carnaval segunda/terça
    expect(segundaDaSemana('2026-11-03')).toBe('2026-11-02')
    expect(segundaDaSemana('2026-11-04')).toBe('2026-11-02')
  })
})

describe('dataPublicacaoValida', () => {
  it('aceita segunda-feira comum', () => {
    expect(dataPublicacaoValida('2026-10-05')).toBe(true)
  })

  it('recusa terça-feira comum', () => {
    expect(dataPublicacaoValida('2026-10-06')).toBe(false)
  })

  it('recusa a segunda-feira que é feriado', () => {
    expect(dataPublicacaoValida('2026-11-02')).toBe(false)
  })

  it('aceita o próximo dia útil após feriado na segunda', () => {
    expect(dataPublicacaoValida('2026-11-03')).toBe(true)
  })

  it('recusa o dia seguinte quando a segunda não era feriado', () => {
    expect(dataPublicacaoValida('2026-10-06')).toBe(false)
  })

  it('aceita a quarta após Carnaval na segunda e na terça', () => {
    expect(dataPublicacaoValida('2026-02-17')).toBe(false)
    expect(dataPublicacaoValida('2026-02-18')).toBe(true)
  })
})
