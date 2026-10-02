// Estado compartilhado entre Configurações > Logomarcas (logo da tela de login) e
// o relatório em PDF da Gestão de Auditoria (cabeçalho do relatório).
// Fase 1: em memória (useState) - recarregar a página restaura a marca padrão.
export const useLogomarcaLogin = () => {
  const caminho = useState<string>('logomarca-login-caminho', () => '')
  const preview = useState<string>('logomarca-login-preview', () => '')
  return { caminho, preview }
}