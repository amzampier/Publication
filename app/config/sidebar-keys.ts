// Mapeamento label visível (PT-BR, app/config/navigation.ts) ↔ chave do banco
// (sidebar_grupos JSON em configuracoes_globais). A UI continua com labels;
// a conversão acontece só na hidratação (GET) e no save (PUT).

export const CHAVES_SIDEBAR = ['publicacoes', 'movimentos', 'cadastros', 'administracao'] as const
export type ChaveSidebar = (typeof CHAVES_SIDEBAR)[number]

export const LABEL_POR_CHAVE: Record<ChaveSidebar, string> = {
  publicacoes: 'Publicações',
  movimentos: 'Movimentos',
  cadastros: 'Cadastros',
  administracao: 'Administração'
}

export const CHAVE_POR_LABEL: Record<string, ChaveSidebar> = Object.fromEntries(
  CHAVES_SIDEBAR.map((chave) => [LABEL_POR_CHAVE[chave], chave])
) as Record<string, ChaveSidebar>

/** Chave do banco para uma label visível; label desconhecida → null. */
export const chavePorLabel = (label: string): ChaveSidebar | null => CHAVE_POR_LABEL[label] ?? null

/** Label visível para uma chave do banco; chave desconhecida → a própria chave. */
export const labelPorChave = (chave: string): string => LABEL_POR_CHAVE[chave as ChaveSidebar] ?? chave
