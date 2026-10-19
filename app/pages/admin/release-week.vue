<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import {
  useReleaseWeekModelo,
  type LinhaReleaseWeek,
  type ReleaseWeekModelo
} from '../../components/release-week/useReleaseWeekModelo'

definePageMeta({ layout: 'admin' })

// Loading no F5 (padrão Softwares/Parceiros): o overlay cobre a hidratação
// inicial. Nesta fase o dataset é síncrono, então mantemos um tempo mínimo
// perceptível; na fase backend será o tempo do GET /api/release-week.
const carregando = ref(true)
onMounted(() => {
  window.setTimeout(() => {
    carregando.value = false
  }, 250)
})

const { toast } = useToast()
const {
  semanas,
  podeExcluirRelease,
  clonarPreenchimento,
  publicar,
  arquivar,
  excluir
} = useReleaseWeekModelo()

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

const confirmarPublicacao = () => {
  const alvo = releasePublicar.value
  if (!alvo) return
  publicarAberto.value = false
  releasePublicar.value = null
  if (publicar(alvo.id)) toast.success('Release Week', 'Release Week publicada com sucesso.')
  else toast.danger('Release Week', 'Não foi possível publicar a Release Week.')
}

const arquivarAberto = ref(false)
const releaseArquivar = ref<LinhaReleaseWeek | null>(null)

const abrirArquivamento = (linha: LinhaReleaseWeek) => {
  releaseArquivar.value = linha
  arquivarAberto.value = true
}

const confirmarArquivamento = () => {
  const alvo = releaseArquivar.value
  if (!alvo) return
  arquivarAberto.value = false
  releaseArquivar.value = null
  if (arquivar(alvo.id)) toast.success('Release Week', 'Release Week arquivada com sucesso.')
  else toast.danger('Release Week', 'Não foi possível arquivar a Release Week.')
}

const exclusaoAberta = ref(false)
const releaseExcluir = ref<LinhaReleaseWeek | null>(null)

const abrirExclusao = (linha: LinhaReleaseWeek) => {
  const registro = resolver(linha)
  if (!registro) return
  if (!podeExcluirRelease(registro)) {
    toast.danger(
      'Release Week',
      'Esta release não pode ser excluída (arquivada ou com itens vinculados).'
    )
    return
  }
  releaseExcluir.value = linha
  exclusaoAberta.value = true
}

const confirmarExclusao = () => {
  const alvo = releaseExcluir.value
  if (!alvo) return
  exclusaoAberta.value = false
  releaseExcluir.value = null
  const resultado = excluir(alvo.id)
  if (resultado.ok) {
    toast.success('Release Week', 'Release Week excluída com sucesso.')
    // O gatilho (menu) saiu do DOM com a linha: devolve o foco à busca.
    nextTick(() => tabelaRef.value?.focarBusca())
  } else {
    toast.danger('Release Week', resultado.motivo ?? 'Não foi possível excluir a Release Week.')
  }
}

const acionarImportacao = () => {
  toast.info(
    'Importação',
    'A importação de Release Weeks estará disponível após a implementação do backend.'
  )
}
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
        @importar="acionarImportacao"
        @open-filters="filtrosAbertos = true"
      />

      <ReleaseWeekFiltros v-model="filtrosAbertos" />

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
