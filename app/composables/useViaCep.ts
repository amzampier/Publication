// Interface com os campos retornados pela API ViaCEP
export interface EnderecoViaCep {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  regiao: string
}

/** Resultado discriminado da consulta: cada falha vira um status próprio para o chamador. */
export type ResultadoCep =
  | { status: 'ok'; endereco: EnderecoViaCep }
  /** menos de 8 dígitos — nenhuma requisição é emitida */
  | { status: 'incompleto' }
  /** a API respondeu com `erro` (CEP fora da base) */
  | { status: 'nao-encontrado' }
  /** rede, HTTP fora de 2xx, JSON inválido ou abortado por tempo limite */
  | { status: 'erro' }

/**
 * Composable cliente puro da API pública ViaCEP — sem loading, toast ou
 * mapeamento de UI (isso vive em `useBuscaCep`).
 *
 * @example
 * const { buscarCep } = useViaCep()
 * const resultado = await buscarCep('01001-000')
 * if (resultado.status === 'ok') {
 *   console.log(resultado.endereco.logradouro) // 'Praça da Sé'
 * }
 */
export const useViaCep = () => {
  /**
   * Busca o endereço correspondente a um CEP na API ViaCEP.
   *
   * @param cep - CEP com ou sem máscara (ex: '01001-000' ou '01001000')
   * @param opcoes - `signal` opcional para abortar a requisição (timeout do chamador)
   * @returns Resultado discriminado (`ok` / `incompleto` / `nao-encontrado` / `erro`)
   */
  const buscarCep = async (
    cep: string,
    opcoes: { signal?: AbortSignal } = {}
  ): Promise<ResultadoCep> => {
    // Remove todos os caracteres não numéricos do CEP
    const cepLimpo = cep.replace(/\D/g, '')

    // Valida se o CEP possui exatamente 8 dígitos — sem fetch
    if (cepLimpo.length !== 8) {
      return { status: 'incompleto' }
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
        signal: opcoes.signal
      })

      // Fora de 2xx (ex.: 400 com corpo HTML) não é JSON de endereço
      if (!response.ok) {
        return { status: 'erro' }
      }

      const data = await response.json()

      // A ViaCEP devolve `erro` para CEP fora da base (boolean true ou string "true")
      if (data.erro) {
        return { status: 'nao-encontrado' }
      }

      // Retorna os campos preenchidos, garantindo string vazia como fallback
      return {
        status: 'ok',
        endereco: {
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          localidade: data.localidade || '',
          uf: data.uf || '',
          regiao: data.regiao || ''
        }
      }
    } catch (error) {
      // Abort pelo tempo limite é falha esperada — não polui o console
      if ((error as Error)?.name !== 'AbortError') {
        console.error('Erro ao buscar CEP:', error)
      }
      return { status: 'erro' }
    }
  }

  return {
    buscarCep,
  }
}
