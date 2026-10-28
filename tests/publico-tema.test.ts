import { describe, expect, it } from 'vitest'
import {
  alternarTemaPublico,
  normalizarTemaPublico,
  resolverTemaInicial,
  rotuloAcaoTema
} from '../shared/publico'

describe('tema público', () => {
  it('prioriza a preferência salva no cookie', () => {
    expect(resolverTemaInicial('escuro', false)).toBe('escuro')
    expect(resolverTemaInicial('claro', true)).toBe('claro')
    expect(resolverTemaInicial(' ESCURO ', false)).toBe('escuro')
    expect(resolverTemaInicial('CLARO', true)).toBe('claro')
  })

  it('usa prefers-color-scheme quando não há cookie válido', () => {
    expect(resolverTemaInicial(undefined, true)).toBe('escuro')
    expect(resolverTemaInicial(null, false)).toBe('claro')
    expect(resolverTemaInicial('invalido', true)).toBe('escuro')
    expect(resolverTemaInicial('invalido', false)).toBe('claro')
  })

  it('normaliza apenas os valores do domínio', () => {
    expect(normalizarTemaPublico('claro')).toBe('claro')
    expect(normalizarTemaPublico('escuro')).toBe('escuro')
    expect(normalizarTemaPublico('')).toBeNull()
    expect(normalizarTemaPublico(1)).toBeNull()
  })

  it('alterna e descreve a ação do botão', () => {
    expect(alternarTemaPublico('claro')).toBe('escuro')
    expect(alternarTemaPublico('escuro')).toBe('claro')
    expect(rotuloAcaoTema('claro')).toBe('Ativar tema escuro')
    expect(rotuloAcaoTema('escuro')).toBe('Ativar tema claro')
  })
})
