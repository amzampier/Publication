export type ErroApi = { status: number; message: string }

export function mensagemErroCarga(erro: ErroApi | null, contexto: string): string {
  if (erro?.status === 403) {
    return `Seu perfil não tem permissão para visualizar ${contexto}.`
  }
  if (erro?.status === 401) {
    return `Sua sessão expirou. Entre novamente para visualizar ${contexto}.`
  }
  if (erro?.message) return erro.message
  return `Não foi possível carregar ${contexto}. Verifique a conexão e tente novamente.`
}
