import { ref } from 'vue'
import { useToast } from './useToast'
import { useViaCep, type EnderecoViaCep } from './useViaCep'
import type { EnderecoUsuario } from '../components/usuarios/useUsuariosModelo'

/** Tempo máximo de voo da consulta ViaCEP antes de abortar (vira toast de falha). */
const TIMEOUT_MS = 10000

/**
 * Orquestrador da busca de CEP compartilhado por Meu Perfil e Gestão de
 * Usuários (capability `busca-cep`): valida, consulta via `useViaCep` com
 * timeout, preenche o endereço e cuida dos toasts de feedback.
 *
 * @param endereco - acesso ao `EnderecoUsuario` vigente (getter: o rascunho
 *   pode ser trocado por referência ao abrir/cancelar — sempre ler na hora)
 * @param titulo - título do toast por módulo ("Meu Perfil", "Gestão de Usuários")
 *
 * @example
 * const { carregando, buscar } = useBuscaCep(() => props.endereco, 'Meu Perfil')
 * const mudou = await buscar() // true = algo foi preenchido (emite change)
 */
export const useBuscaCep = (
  endereco: () => EnderecoUsuario,
  titulo: string
) => {
  const carregando = ref(false)
  const { toast } = useToast()
  const { buscarCep } = useViaCep()

  /** Grava apenas os campos com valor na resposta; Número/Complemento/CEP ficam intactos. */
  const preencher = (dados: EnderecoViaCep): boolean => {
    const alvo = endereco()
    let mudou = false
    const aplicar = (
      campo: 'logradouro' | 'bairro' | 'cidade' | 'estado' | 'regiao',
      valor: string
    ) => {
      if (valor && alvo[campo] !== valor) {
        alvo[campo] = valor
        mudou = true
      }
    }
    aplicar('logradouro', dados.logradouro)
    aplicar('bairro', dados.bairro)
    aplicar('cidade', dados.localidade)
    aplicar('estado', dados.uf)
    aplicar('regiao', dados.regiao)
    return mudou
  }

  /**
   * Executa a busca para o CEP atual do endereço.
   *
   * @returns `true` quando a resposta alterou algum campo (o chamador decide
   *   se marca o rascunho como alterado); `false` em falha ou consulta sem mudança
   */
  const buscar = async (): Promise<boolean> => {
    // Clique/Enter em voo são ignorados — uma única requisição por vez
    if (carregando.value) return false

    carregando.value = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const resultado = await buscarCep(endereco().cep, { signal: controller.signal })

      if (resultado.status === 'incompleto') {
        toast.warning(titulo, 'Informe um CEP com 8 dígitos.')
        return false
      }
      if (resultado.status === 'nao-encontrado') {
        toast.danger(titulo, 'CEP não encontrado. Verifique o número digitado.')
        return false
      }
      if (resultado.status === 'erro') {
        toast.danger(titulo, 'Não foi possível consultar o CEP. Tente novamente.')
        return false
      }

      // Sucesso: o preenchimento dos campos é o próprio feedback (sem toast)
      return preencher(resultado.endereco)
    } finally {
      clearTimeout(timeout)
      carregando.value = false
    }
  }

  return {
    carregando,
    buscar,
  }
}
