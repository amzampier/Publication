// Reconciliacao das chamadas filhas quando um conteudo pai entra ou sai de
// `Publicado`. Centraliza a cascata (Release Week, Manual e Escopo) para que o
// botao Publicar, a edicao direta do status e a reabertura por vinculo usem a
// mesma regra e o mesmo historico.
import type { AtorTransicao, ExecutorSql } from './historico-esteira'
import type { TipoVinculo } from '#shared/esteira-revisao'

type Row = Record<string, unknown>

interface ConfigPai {
  tabela: string
  fk: 'release_id' | 'manual_id' | 'projeto_id'
}

const CONFIG: Record<TipoVinculo, ConfigPai> = {
  release: { tabela: 'release_week', fk: 'release_id' },
  manual: { tabela: 'manuais_mensal', fk: 'manual_id' },
  projeto: { tabela: 'projetos_escopo', fk: 'projeto_id' }
}

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor).trim()

const PARECER_PUBLICAR = 'Publicado automaticamente com o conteudo pai'
const PARECER_REVERTER = 'Devolvido para aguardar a publicacao do conteudo pai'

/** Condicao "nenhum outro vinculo ativo publicado" para reverter uma filha. */
const SEM_OUTRO_PAI_PUBLICADO = `
  NOT EXISTS (
    SELECT 1 FROM release_week r
     WHERE r.id = e.release_id AND r.status = 'Publicado' AND r.arquivada = 0
  )
  AND NOT EXISTS (
    SELECT 1 FROM manuais_mensal m
     WHERE m.id = e.manual_id AND m.status = 'Publicado' AND m.arquivada = 0
  )
  AND NOT EXISTS (
    SELECT 1 FROM projetos_escopo p
     WHERE p.id = e.projeto_id AND p.status = 'Publicado' AND p.arquivada = 0
  )`

const SQL_HISTORICO = `INSERT INTO historico_esteira_revisao
  (entrega_item_id, chamada, status_anterior, novo_status, responsavel_id,
   responsavel_nome, responsavel_perfil, parecer_tecnico,
   criterios_aceite_atendidos, tempo_no_estagio_minutos)
SELECT e.id, e.chamada, ?, ?, ?, ?, ?, ?, 1,
  GREATEST(TIMESTAMPDIFF(MINUTE,
    COALESCE(
      (SELECT MAX(h.data_transicao)
         FROM historico_esteira_revisao h
        WHERE h.entrega_item_id = e.id AND h.novo_status = ?),
      e.criado_em),
    NOW()), 0)
  FROM entregas_itens e
 WHERE e.FK = ? AND e.status = ?`

interface ResultadoCascata {
  publicadas: number
  revertidas: number
}

/**
 * Publica as filhas em `Publicar` quando o pai esta `Publicado` e devolve para
 * `Publicar` as filhas em `Publicado` que perderam o ultimo vinculo publicado.
 * Deve ser chamado dentro da mesma transacao da alteracao do pai.
 */
export async function reconciliarFilhasPublicacao(
  executor: ExecutorSql,
  tipo: TipoVinculo,
  id: string,
  ator: AtorTransicao
): Promise<ResultadoCascata> {
  const config = CONFIG[tipo]
  const pais = await executor.query<Row[]>(
    `SELECT codigo, status FROM ${config.tabela} WHERE id = ? LIMIT 1`,
    [id]
  )
  const pai = pais[0]
  if (!pai) return { publicadas: 0, revertidas: 0 }

  const codigo = texto(pai.codigo) || id
  const publicado = texto(pai.status) === 'Publicado'
  const responsavelNome = (ator.nome || 'Sistema').slice(0, 150)
  const responsavelPerfil = (ator.perfil ?? '').slice(0, 100) || 'Sistema'
  const responsavelId = ator.id ?? null

  if (publicado) {
    const sqlHistorico = SQL_HISTORICO.replace('e.FK', `e.${config.fk}`)
    await executor.query(sqlHistorico, [
      'Publicar',
      'Publicado',
      responsavelId,
      responsavelNome,
      responsavelPerfil,
      `${PARECER_PUBLICAR} ${codigo}`,
      'Publicar',
      id,
      'Publicar'
    ])
    const resultado = await executor.query<{ affectedRows: number }>(
      `UPDATE entregas_itens e
          SET e.status = 'Publicado'
        WHERE e.${config.fk} = ? AND e.status = 'Publicar'`,
      [id]
    )
    return { publicadas: Number(resultado.affectedRows ?? 0), revertidas: 0 }
  }

  await executor.query(
    `INSERT INTO historico_esteira_revisao
      (entrega_item_id, chamada, status_anterior, novo_status, responsavel_id,
       responsavel_nome, responsavel_perfil, parecer_tecnico,
       criterios_aceite_atendidos, tempo_no_estagio_minutos)
     SELECT e.id, e.chamada, 'Publicado', 'Publicar', ?, ?, ?, ?, 1,
       GREATEST(TIMESTAMPDIFF(MINUTE,
         COALESCE(
           (SELECT MAX(h.data_transicao)
              FROM historico_esteira_revisao h
             WHERE h.entrega_item_id = e.id AND h.novo_status = 'Publicado'),
           e.criado_em),
         NOW()), 0)
       FROM entregas_itens e
      WHERE e.${config.fk} = ? AND e.status = 'Publicado'
        AND ${SEM_OUTRO_PAI_PUBLICADO}`,
    [
      responsavelId,
      responsavelNome,
      responsavelPerfil,
      `${PARECER_REVERTER} ${codigo}`,
      id
    ]
  )
  const resultado = await executor.query<{ affectedRows: number }>(
    `UPDATE entregas_itens e
        SET e.status = 'Publicar'
      WHERE e.${config.fk} = ? AND e.status = 'Publicado'
        AND ${SEM_OUTRO_PAI_PUBLICADO}`,
    [id]
  )
  return { publicadas: 0, revertidas: Number(resultado.affectedRows ?? 0) }
}
