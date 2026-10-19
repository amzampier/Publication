// Catálogo de funcionalidades POR MÓDULO (matriz de permissões) — parte pura,
// sem imports de Nuxt (mesmo padrão de app/config/brasil.ts). É o espelho de
// server/utils/perfis.ts (barreira app/ × server/): mantenha os dois em
// sincronia — o teste tests/perfis-funcionalidades.test.ts cobre o alinhamento.

/** Funcionalidades fixas (colunas TINYINT de permissoes_perfil). */
export const FUNCIONALIDADES_FIXAS = ['visualizar', 'criar', 'alterar', 'excluir'] as const

/** Funcionalidades específicas (não-fixas) — persistidas no `extras` JSON. */
export const FUNCIONALIDADES_EXTRAS = [
  'publicar',
  'arquivar',
  'download',
  'exportar',
  'importar',
  'filtrar',
  'buscar',
  'permissoes',
  'convite',
  'clonar',
  'visualizar_itens'
] as const

/** Funcionalidades de cada módulo (mesmos ids de server/utils/perfis.ts). */
export const FUNCIONALIDADES_POR_MODULO: Record<string, readonly string[]> = {
  'manuais': ['visualizar', 'criar', 'alterar', 'excluir', 'publicar', 'arquivar', 'download', 'exportar', 'importar', 'filtrar', 'buscar'],
  'release-week': ['visualizar', 'criar', 'alterar', 'excluir', 'publicar', 'arquivar', 'download', 'exportar', 'importar', 'filtrar', 'buscar', 'clonar', 'visualizar_itens'],
  'escopo-projetos': ['visualizar', 'criar', 'alterar', 'excluir', 'publicar', 'arquivar', 'download', 'exportar', 'importar', 'filtrar', 'buscar'],
  'esteira-revisao': ['visualizar', 'alterar', 'publicar', 'arquivar', 'filtrar'],
  'lancar-chamadas': ['visualizar', 'criar', 'alterar', 'excluir', 'publicar', 'arquivar', 'download', 'filtrar', 'buscar'],
  'parceiros': ['visualizar', 'criar', 'alterar', 'excluir', 'importar', 'exportar', 'filtrar', 'buscar'],
  'softwares': ['visualizar', 'criar', 'alterar', 'excluir', 'importar', 'exportar', 'filtrar', 'buscar'],
  'gestao-usuarios': ['visualizar', 'criar', 'alterar', 'excluir', 'importar', 'exportar', 'filtrar', 'buscar', 'convite'],
  'perfis-acesso': ['visualizar', 'criar', 'alterar', 'excluir', 'permissoes', 'exportar', 'filtrar', 'buscar'],
  'auditoria': ['visualizar', 'exportar', 'filtrar', 'buscar'],
  'configuracoes-globais': ['visualizar', 'alterar']
}
