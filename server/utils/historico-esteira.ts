// Histórico imutável das transições da esteira de revisão
// (`historico_esteira_revisao`). Fica fora de `lancar-chamadas.ts` para que a
// Esteira e Lançar as Chamadas compartilhem a gravação sem ciclo de imports.
import { query } from './db'
import type { HistoricoEsteira } from '#shared/esteira-revisao'

type Row = Record<string, unknown>

export interface AtorTransicao {
  id?: string | null
  nome: string
  perfil?: string
}

export interface OpcoesTransicao {
  parecer?: string
  criterios?: boolean
}

export interface DadosTransicao {
  itemId: string
  chamada: string
  statusAnterior: string
  novoStatus: string
  ator: AtorTransicao
  parecer?: string
  criterios?: boolean
  /** ISO/data de criação do item — fallback quando não há transição anterior. */
  criadoEm: string
}

/** Executor mínimo aceito tanto pelo pool quanto por uma transação. */
export interface ExecutorSql {
  query: <T = unknown>(sql: string, valores?: unknown[]) => Promise<T>
}

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor)

const dataIso = (valor: unknown): string => {
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'string' && valor) {
    const data = new Date(valor)
    return Number.isNaN(data.getTime()) ? valor : data.toISOString()
  }
  return ''
}

/**
 * Registra uma transição no histórico, calculando o tempo no estágio anterior
 * a partir da última transição para aquele status (ou do `criado_em` do item).
 * Deve ser chamado dentro da mesma transação que atualiza `entregas_itens`.
 */
export async function registrarTransicao(
  executor: ExecutorSql,
  dados: DadosTransicao
): Promise<void> {
  const linhas = await executor.query<Array<{ minutos: number | null }>>(
    `SELECT TIMESTAMPDIFF(
        MINUTE,
        COALESCE(
          (SELECT MAX(h.data_transicao)
             FROM historico_esteira_revisao h
            WHERE h.entrega_item_id = ? AND h.novo_status = ?),
          ?
        ),
        NOW()
      ) AS minutos`,
    [dados.itemId, dados.statusAnterior, dados.criadoEm]
  )
  const minutos = linhas[0]?.minutos == null ? null : Number(linhas[0].minutos)

  await executor.query(
    `INSERT INTO historico_esteira_revisao
      (entrega_item_id, chamada, status_anterior, novo_status, responsavel_id,
       responsavel_nome, responsavel_perfil, parecer_tecnico,
       criterios_aceite_atendidos, tempo_no_estagio_minutos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dados.itemId,
      dados.chamada,
      dados.statusAnterior,
      dados.novoStatus,
      dados.ator.id ?? null,
      dados.ator.nome.slice(0, 150),
      (dados.ator.perfil ?? '').slice(0, 100) || '—',
      dados.parecer?.trim() || null,
      dados.criterios === false ? 0 : 1,
      minutos
    ]
  )
}

/** Histórico de um item em ordem cronológica (mais antigo primeiro). */
export async function listarHistoricoItem(itemId: string): Promise<HistoricoEsteira[]> {
  const linhas = await query<Row[]>(
    `SELECT id, status_anterior, novo_status, responsavel_id, responsavel_nome,
            responsavel_perfil, parecer_tecnico, criterios_aceite_atendidos,
            tempo_no_estagio_minutos, data_transicao
       FROM historico_esteira_revisao
      WHERE entrega_item_id = ?
      ORDER BY data_transicao ASC, id ASC`,
    [itemId]
  )
  return linhas.map((linha) => ({
    id: texto(linha.id),
    statusAnterior: texto(linha.status_anterior),
    novoStatus: texto(linha.novo_status),
    responsavelId: texto(linha.responsavel_id),
    responsavelNome: texto(linha.responsavel_nome),
    responsavelPerfil: texto(linha.responsavel_perfil),
    parecer: texto(linha.parecer_tecnico),
    criteriosAtendidos: Number(linha.criterios_aceite_atendidos ?? 0) === 1,
    tempoNoEstagioMinutos:
      linha.tempo_no_estagio_minutos == null
        ? null
        : Number(linha.tempo_no_estagio_minutos),
    dataTransicao: dataIso(linha.data_transicao)
  }))
}

/** Entrada no estágio atual: última transição para ele ou o `criado_em`. */
export async function ultimaEntradaNoEstagio(
  itemId: string,
  statusAtual: string,
  criadoEm: string
): Promise<string> {
  const linhas = await query<Array<{ data_transicao: Date | string }>>(
    `SELECT data_transicao
       FROM historico_esteira_revisao
      WHERE entrega_item_id = ? AND novo_status = ?
      ORDER BY data_transicao DESC
      LIMIT 1`,
    [itemId, statusAtual]
  )
  return linhas[0] ? dataIso(linhas[0].data_transicao) : criadoEm
}
