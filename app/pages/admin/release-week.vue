<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import {
  useReleaseWeekModelo,
  type LinhaReleaseWeek,
  type ReleaseWeekModelo
} from '../../components/release-week/useReleaseWeekModelo'

definePageMeta({ layout: 'admin' })

// Loading no F5 (padrão Softwares/Parceiros): o overlay cobre o GET real de
// /api/release-week; a tabela só monta depois da resposta.
const carregando = ref(true)

const { toast } = useToast()
const {
  semanas,
  carregarSemanas,
  clonarPreenchimento,
  publicar,
  arquivar,
  excluir
} = useReleaseWeekModelo()

onMounted(async () => {
  // Entrar na página sempre rebusca as releases e invalida o cache de itens:
  // o status dos itens pode ter mudado em "Lançar as Chamadas" (aprovação/recusa).
  const ok = await carregarSemanas(true)
  carregando.value = false
  if (!ok) {
    toast.danger(
      'Release Week',
      'Não foi possível carregar as Release Weeks. Recarregue a página e tente novamente.'
    )
  }
})

// Coordenação da página (molde Softwares/Parceiros): a página é dona do estado
// dos modais; cada componente de domínio só apresenta e emite.
const filtrosAbertos = ref(false)

const modalAberto = ref(false)
const modo = ref<'novo' | 'editar'>('novo')
const releaseEditar = ref<ReleaseWeekModelo | null>(null)
const prefill = ref<{ versao: string; release: string; destaqueSemana: boolean } | null>(null)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)

const resolver = (linha: LinhaReleaseWeek): ReleaseWeekModelo | null =>
  semanas.value.find((semana) => semana.id === linha.id) ?? null

const abrirNovo = () => {
  modo.value = 'novo'
  releaseEditar.value = null
  prefill.value = null
  modalAberto.value = true
}

const abrirEdicao = (linha: LinhaReleaseWeek) => {
  const registro = resolver(linha)
  if (!registro) return
  modo.value = 'editar'
  releaseEditar.value = registro
  prefill.value = null
  modalAberto.value = true
}

const abrirClonagem = (linha: LinhaReleaseWeek) => {
  const registro = resolver(linha)
  if (!registro) return
  modo.value = 'novo'
  releaseEditar.value = null
  prefill.value = clonarPreenchimento(registro)
  modalAberto.value = true
}

const publicarAberto = ref(false)
const releasePublicar = ref<LinhaReleaseWeek | null>(null)

const abrirPublicacao = (linha: LinhaReleaseWeek) => {
  releasePublicar.value = linha
  publicarAberto.value = true
}

const mensagemErro = (erro: unknown): string =>
  (erro as { data?: { statusMessage?: string }; statusMessage?: string } | null)?.data
    ?.statusMessage ??
  (erro as { statusMessage?: string } | null)?.statusMessage ??
  'Não foi possível concluir a operação.'

const confirmarPublicacao = async () => {
  const alvo = releasePublicar.value
  if (!alvo) return
  publicarAberto.value = false
  releasePublicar.value = null
  try {
    await publicar(alvo.id)
    toast.success('Release Week', 'Release Week publicada com sucesso.')
  } catch (erro) {
    toast.danger('Release Week', mensagemErro(erro))
  }
}

const arquivarAberto = ref(false)
const releaseArquivar = ref<LinhaReleaseWeek | null>(null)

const abrirArquivamento = (linha: LinhaReleaseWeek) => {
  releaseArquivar.value = linha
  arquivarAberto.value = true
}

const confirmarArquivamento = async () => {
  const alvo = releaseArquivar.value
  if (!alvo) return
  arquivarAberto.value = false
  releaseArquivar.value = null
  try {
    await arquivar(alvo.id)
    toast.success('Release Week', 'Release Week arquivada com sucesso.')
  } catch (erro) {
    toast.danger('Release Week', mensagemErro(erro))
  }
}

const exclusaoAberta = ref(false)
const releaseExcluir = ref<LinhaReleaseWeek | null>(null)

const abrirExclusao = (linha: LinhaReleaseWeek) => {
  if (linha.itensCount > 0) {
    toast.danger('Release Week', 'Release com itens vinculados não pode ser excluída.')
    return
  }
  releaseExcluir.value = linha
  exclusaoAberta.value = true
}

const confirmarExclusao = async () => {
  const alvo = releaseExcluir.value
  if (!alvo) return
  exclusaoAberta.value = false
  releaseExcluir.value = null
  const resultado = await excluir(alvo.id)
  if (resultado.ok) {
    toast.success('Release Week', 'Release Week excluída com sucesso.')
    // O gatilho (menu) saiu do DOM com a linha: devolve o foco à busca.
    nextTick(() => tabelaRef.value?.focarBusca())
  } else {
    toast.danger('Release Week', resultado.motivo ?? 'Não foi possível excluir a Release Week.')
  }
}

const importarAberto = ref(false)
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <UiLoading v-if="carregando" message="Carregando Release Week…" />

    <div v-else class="mx-auto max-w-7xl">
      <ReleaseWeekCabecalho @novo="abrirNovo" />

      <ReleaseWeekKpis class="mt-6" />

      <ReleaseWeekTabela
        ref="tabelaRef"
        class="mt-5"
        @editar="abrirEdicao"
        @clonar="abrirClonagem"
        @publicar="abrirPublicacao"
        @arquivar="abrirArquivamento"
        @excluir="abrirExclusao"
        @importar="importarAberto = true"
        @open-filters="filtrosAbertos = true"
      />

      <ReleaseWeekFiltros v-model="filtrosAbertos" />

      <ReleaseWeekImportar v-model="importarAberto" />

      <ReleaseWeekFormulario
        v-model="modalAberto"
        :modo="modo"
        :release="releaseEditar"
        :prefill="prefill"
      />

      <ReleaseWeekPublicar
        v-model="publicarAberto"
        :release="releasePublicar"
        @confirmar="confirmarPublicacao"
      />

      <ReleaseWeekArquivar
        v-model="arquivarAberto"
        :release="releaseArquivar"
        @confirmar="confirmarArquivamento"
      />

      <ReleaseWeekExclusao
        v-model="exclusaoAberta"
        :release="releaseExcluir"
        @confirmar="confirmarExclusao"
      />
    </div>
  </div>
</template>
