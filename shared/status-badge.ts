// Mapa canônico de status editorial → variante de UiBadge (RL06-M-15).
export type VarianteStatus =
  | 'done'
  | 'reconciled'
  | 'pending'
  | 'inReview'
  | 'blocked'
  | 'neutral'
  | 'aberta'
  | 'publicado'
  | 'alteracoes'

export const VARIANTE_RELEASE: Record<string, VarianteStatus> = {
  Aberta: 'aberta',
  'Em Revisão': 'inReview',
  Aprovado: 'reconciled',
  Publicado: 'publicado'
}

export const VARIANTE_MANUAL: Record<string, VarianteStatus> = {
  Rascunho: 'neutral',
  'Em Revisão': 'inReview',
  'Alterações Solicitadas': 'alteracoes',
  Aprovado: 'reconciled',
  Publicado: 'publicado'
}

export const VARIANTE_ESCOPO: Record<string, VarianteStatus> = {
  'Em Andamento': 'aberta',
  Homologação: 'inReview',
  Concluído: 'done',
  Publicado: 'publicado'
}

export const VARIANTE_CHAMADA: Record<string, VarianteStatus> = {
  Revisar: 'pending',
  Aprovado: 'reconciled',
  Recusado: 'blocked',
  Publicar: 'done',
  Publicado: 'publicado'
}

export type DominioStatus = 'release' | 'manual' | 'escopo' | 'chamada'

export function varianteStatus(dominio: DominioStatus, status: string): VarianteStatus {
  const mapa =
    dominio === 'release'
      ? VARIANTE_RELEASE
      : dominio === 'manual'
        ? VARIANTE_MANUAL
        : dominio === 'escopo'
          ? VARIANTE_ESCOPO
          : VARIANTE_CHAMADA
  return mapa[status] ?? 'neutral'
}