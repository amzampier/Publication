import { mensagemErroCarga, type ErroApi } from '#shared/erro-carga'

export function useErroCarga() {
  const erro = useState<ErroApi | null>('api-ultimo-erro', () => null)

  const mensagem = (contexto: string) => mensagemErroCarga(erro.value, contexto)
  const limpar = () => {
    erro.value = null
  }

  return { erro, mensagem, limpar }
}
