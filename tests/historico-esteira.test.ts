import { describe, it, expect } from 'vitest'
import {
  registrarTransicao,
  type ExecutorSql
} from '../server/utils/historico-esteira'

describe('registrarTransicao', () => {
  it('calcula o tempo no estágio no banco e protege contra valor negativo', async () => {
    const consultas: { sql: string; valores?: unknown[] }[] = []
    const executor: ExecutorSql = {
      async query<T>(sql: string, valores?: unknown[]): Promise<T> {
        consultas.push({ sql, valores })
        return (sql.includes('TIMESTAMPDIFF') ? [{ minutos: 0 }] : []) as T
      }
    }

    await registrarTransicao(executor, {
      itemId: 'item-1',
      chamada: '0000578781',
      statusAnterior: 'Revisar',
      novoStatus: 'Aprovado',
      ator: { id: 'user-1', nome: 'Ana', perfil: 'Revisor' }
    })

    expect(consultas[0]?.sql).toContain('GREATEST')
    expect(consultas[0]?.sql).toContain('entregas_itens')
    expect(consultas[0]?.sql).toContain('NOW()')
    expect(consultas[0]?.valores).toEqual(['item-1', 'Revisar', 'item-1'])
    expect(consultas[1]?.valores?.[9]).toBe(0)
  })
})
