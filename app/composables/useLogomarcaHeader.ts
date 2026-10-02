// Estado compartilhado entre Configurações > Logomarcas e o AppHeader do shell.
// Fase 1: em memória (useState) — recarregar a página restaura a marca padrão.
export const useLogomarcaHeader = () => {
  const caminho = useState<string>('logomarca-header-caminho', () => '')
  const preview = useState<string>('logomarca-header-preview', () => '')
  return { caminho, preview }
}
