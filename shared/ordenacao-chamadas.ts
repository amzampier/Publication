/** Colunas ordenáveis do servidor de Chamadas (whitelist). */
export const COLUNAS_ORDEM_CHAMADAS: Record<string, string> = {
  chamada: 'e.chamada',
  titulo: 'e.titulo',
  software: 'e.software',
  vinculo: 'e.release',
  tipo: 'e.tipo',
  impacto: 'e.impacto',
  status: 'e.status',
  dataLancamentoIso: 'e.data_lancamento',
  dataLiberacaoIso: 'e.data_liberacao'
}

export function ordemChamadas(ordenar?: string, direcao?: string): string {
  const coluna = COLUNAS_ORDEM_CHAMADAS[ordenar ?? ''] ?? 'e.chamada'
  const dir = direcao === 'desc' ? 'DESC' : 'ASC'
  return `${coluna} ${dir}, e.chamada ASC`
}