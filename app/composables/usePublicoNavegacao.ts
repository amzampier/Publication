// Navegação pública compartilhada pelo shell: uma única leitura SSR para a
// sidebar, com estados de carregamento, erro e retry.
import { computed } from 'vue'
import type { PublicoNavegacao } from '#shared/publico'

const VAZIO: PublicoNavegacao = { releases: [], manuais: [], escopos: [] }

export function usePublicoNavegacao() {
  const { data, pending, error, refresh } = useAsyncData<PublicoNavegacao>(
    'publico-navegacao',
    () => $fetch<PublicoNavegacao>('/api/publico/navegacao'),
    { default: () => ({ ...VAZIO }) }
  )

  const releases = computed(() => data.value?.releases ?? [])
  const manuais = computed(() => data.value?.manuais ?? [])
  const escopos = computed(() => data.value?.escopos ?? [])
  const carregando = computed(() => pending.value)
  const erro = computed(() =>
    error.value ? 'Não foi possível carregar a navegação da Área Pública.' : ''
  )

  const recarregar = () => refresh()

  return { data, releases, manuais, escopos, carregando, erro, recarregar }
}
