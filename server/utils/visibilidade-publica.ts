// Regra única de visibilidade pública do conteúdo editorial.
// Uma chamada só é pública quando está `Publicado` e possui ao menos um vínculo
// ativo com conteúdo pai `Publicado` e não arquivado. Arquivar o pai NÃO altera
// o status da filha (specs release-week/manuais/escopo), mas o gate a esconde.
import type { ContextoVinculo } from '#shared/esteira-revisao'

export interface ContextoVisibilidade {
  release?: ContextoVinculo | null
  manual?: ContextoVinculo | null
  projeto?: ContextoVinculo | null
}

/** Contexto de pai visível no portal: status Publicado e não arquivado. */
export function contextoPublicado(contexto: ContextoVinculo | null | undefined): boolean {
  return Boolean(contexto && contexto.status === 'Publicado' && !contexto.arquivada)
}

/** Chamada visível no portal: status Publicado + ao menos um pai visível. */
export function itemVisivelNoPortal(
  status: string | null | undefined,
  contexto: ContextoVisibilidade | null | undefined
): boolean {
  if (status !== 'Publicado' || !contexto) return false
  return (
    contextoPublicado(contexto.release) ||
    contextoPublicado(contexto.manual) ||
    contextoPublicado(contexto.projeto)
  )
}

/**
 * Expressão SQL equivalente a `itemVisivelNoPortal` para uma chamada com alias.
 * O alias é controlado pelo servidor (não vem do cliente).
 */
export function sqlVinculoPublicado(alias = 'e'): string {
  return `(
    EXISTS (SELECT 1 FROM release_week r
             WHERE r.id = ${alias}.release_id AND r.status = 'Publicado' AND r.arquivada = 0)
    OR EXISTS (SELECT 1 FROM manuais_mensal m
                WHERE m.id = ${alias}.manual_id AND m.status = 'Publicado' AND m.arquivada = 0)
    OR EXISTS (SELECT 1 FROM projetos_escopo p
                WHERE p.id = ${alias}.projeto_id AND p.status = 'Publicado' AND p.arquivada = 0)
  )`
}