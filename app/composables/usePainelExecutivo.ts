import { useState } from '#app'
import { useApiFetch } from './useApiFetch'
import type { PainelExecutivo } from '#shared/painel-executivo'

/**
 * Estado do Painel Executivo. Sem cache: cada carga substitui o conjunto e uma
 * falha descarta os dados (os blocos voltam ao estado vazio/zero).
 */
export const usePainelExecutivo = () => {
  const dados = useState<PainelExecutivo | null>('painel-executivo-dados', () => null)
  const ano = useState<number>('painel-executivo-ano', () => new Date().getFullYear())
  const carregando = useState<boolean>('painel-executivo-carregando', () => false)
  const carregado = useState<boolean>('painel-executivo-carregado', () => false)
  const erro = useState<boolean>('painel-executivo-erro', () => false)

  const carregar = async (forcar = false, comAno = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false

    carregando.value = true
    erro.value = false
    try {
      const url = comAno
        ? `/api/painel-executivo?ano=${ano.value}`
        : '/api/painel-executivo'
      const resposta = await useApiFetch<PainelExecutivo>(url)
      dados.value = resposta
      ano.value = resposta.periodo.ano
      carregado.value = true
      return true
    } catch {
      dados.value = null
      carregado.value = false
      erro.value = true
      return false
    } finally {
      carregando.value = false
    }
  }

  const trocarAno = async (novo: number): Promise<boolean> => {
    if (!Number.isFinite(novo)) return false
    if (novo === ano.value && carregado.value) return true
    ano.value = novo
    carregado.value = false
    return carregar(true, true)
  }

  return { dados, ano, carregando, carregado, erro, carregar, trocarAno }
}
