import { describe, expect, it } from 'vitest'
import { exigePermissaoPublicar } from '../server/utils/permission'

describe('permissão de publicação', () => {
  it('exige publicar ao entrar em Publicado', () => {
    expect(exigePermissaoPublicar('Aberta', 'Publicado')).toBe(true)
    expect(exigePermissaoPublicar('Em Revisão', 'Publicado')).toBe(true)
    expect(exigePermissaoPublicar(undefined, 'Publicado')).toBe(true)
  })

  it('não exige publicar ao permanecer em Publicado', () => {
    expect(exigePermissaoPublicar('Publicado', 'Publicado')).toBe(false)
  })

  it('não exige publicar ao sair de Publicado', () => {
    expect(exigePermissaoPublicar('Publicado', 'Aberta')).toBe(false)
    expect(exigePermissaoPublicar('Em Revisão', 'Aprovado')).toBe(false)
  })
})