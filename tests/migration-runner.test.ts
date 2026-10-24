import { describe, expect, it } from 'vitest'
import { splitStatements } from '../server/utils/migration-runner'

describe('splitStatements', () => {
  it('mantém blocos com DELIMITER $$ intactos', () => {
    const sql = [
      'DELIMITER $$',
      'CREATE TRIGGER t BEFORE UPDATE ON x FOR EACH ROW',
      'BEGIN',
      "  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'não pode';",
      'END$$',
      'DELIMITER ;',
      'SELECT 1;'
    ].join('\n')

    const statements = splitStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('SIGNAL SQLSTATE')
    expect(statements[1]).toBe('SELECT 1')
  })

  it('continua dividindo por ; no formato convencional', () => {
    expect(splitStatements('SELECT 1; SELECT 2;')).toEqual(['SELECT 1', 'SELECT 2'])
  })
})
