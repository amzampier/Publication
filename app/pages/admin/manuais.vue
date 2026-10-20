<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import {
  useManuaisModelo,
  type LinhaManual,
  type ManuaisModelo
} from '../../components/manuais/useManuaisModelo'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const {
  manuais,
  carregarManuais,
  clonarPreenchimento,
  publicar,
  arquivar,
  excluir
} = useManuaisModelo()

const carregando = ref(true)

onMounted(async () => {
  const ok = await carregarManuais()
  carregando.value = false
  if (!ok) {
    toast.danger(
      'Manuais Mensais',
      'Não foi possível carregar os manuais. Recarregue a página e tente novamente.'
    )
  }
})

// Coordenação da página (molde Release Week): a página é dona do estado dos
// modais; cada componente de domínio só apresenta e emite.
const filtrosAbertos = ref(false)

const modalAberto = ref(false)
const modo = ref<'novo' | 'editar'>('novo')
const manualEditar = ref<ManuaisModelo | null>(null)
const prefill = ref<{
  titulo: string
  descricao: string
  destaqueMes: boolean
  destaqueSemana: boolean
} | null>(null)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)

const resolver = (linha: LinhaManual): ManuaisModelo | null =>
  manuais.value.find((manual) => manual.id === linha.id) ?? null

const abrirNovo = () => {
  modo.value = 'novo'
  manualEditar.value = null
  prefill.value = null
  modalAberto.value = true
}

const abrirEdicao = (linha: LinhaManual) => {
  const registro = resolver(linha)
  if (!registro) return
  modo.value = 'editar'
  manualEditar.value = registro
  prefill.value = null
  modalAberto.value = true
}

const abrirClonagem = (linha: LinhaManual) => {
  const registro = resolver(linha)
  if (!registro) return
  modo.value = 'novo'
  manualEditar.value = null
  prefill.value = clonarPreenchimento(registro)
  modalAberto.value = true
}

const publicarAberto = ref(false)
const manualPublicar = ref<LinhaManual | null>(null)

const abrirPublicacao = (linha: LinhaManual) => {
  manualPublicar.value = linha
  publicarAberto.value = true
}

const mensagemErro = (erro: unknown): string =>
  (erro as { data?: { statusMessage?: string }; statusMessage?: string } | null)?.data
    ?.statusMessage ??
  (erro as { statusMessage?: string } | null)?.statusMessage ??
  'Não foi possível concluir a operação.'

const confirmarPublicacao = async () => {
  const alvo = manualPublicar.value
  if (!alvo) return
  publicarAberto.value = false
  manualPublicar.value = null
  try {
    await publicar(alvo.id)
    toast.success('Manuais Mensais', 'Manual publicado com sucesso.')
  } catch (erro) {
    toast.danger('Manuais Mensais', mensagemErro(erro))
  }
}

const arquivarAberto = ref(false)
const manualArquivar = ref<LinhaManual | null>(null)

const abrirArquivamento = (linha: LinhaManual) => {
  manualArquivar.value = linha
  arquivarAberto.value = true
}

const confirmarArquivamento = async () => {
  const alvo = manualArquivar.value
  if (!alvo) return
  arquivarAberto.value = false
  manualArquivar.value = null
  try {
    await arquivar(alvo.id)
    toast.success('Manuais Mensais', 'Manual arquivado com sucesso.')
  } catch (erro) {
    toast.danger('Manuais Mensais', mensagemErro(erro))
  }
}

const exclusaoAberta = ref(false)
const manualExcluir = ref<LinhaManual | null>(null)

const abrirExclusao = (linha: LinhaManual) => {
  if (linha.itensCount > 0) {
    toast.danger('Manuais Mensais', 'Manual com itens vinculados não pode ser excluído.')
    return
  }
  manualExcluir.value = linha
  exclusaoAberta.value = true
}

const confirmarExclusao = async () => {
  const alvo = manualExcluir.value
  if (!alvo) return
  exclusaoAberta.value = false
  manualExcluir.value = null
  const resultado = await excluir(alvo.id)
  if (resultado.ok) {
    toast.success('Manuais Mensais', 'Manual excluído com sucesso.')
    // O gatilho (menu) saiu do DOM com a linha: devolve o foco à busca.
    nextTick(() => tabelaRef.value?.focarBusca())
  } else {
    toast.danger('Manuais Mensais', resultado.motivo ?? 'Não foi possível excluir o manual.')
  }
}

const importarAberto = ref(false)
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <UiLoading v-if="carregando" message="Carregando Manuais Mensais…" />

    <div v-else class="mx-auto max-w-7xl">
      <ManuaisCabecalho @novo="abrirNovo" />

      <ManuaisKpis class="mt-6" />

      <ManuaisTabela
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

      <ManuaisFiltros v-model="filtrosAbertos" />

      <ManuaisImportar v-model="importarAberto" />

      <ManuaisFormulario
        v-model="modalAberto"
        :modo="modo"
        :manual="manualEditar"
        :prefill="prefill"
      />

      <ManuaisPublicar
        v-model="publicarAberto"
        :manual="manualPublicar"
        @confirmar="confirmarPublicacao"
      />

      <ManuaisArquivar
        v-model="arquivarAberto"
        :manual="manualArquivar"
        @confirmar="confirmarArquivamento"
      />

      <ManuaisExclusao
        v-model="exclusaoAberta"
        :manual="manualExcluir"
        @confirmar="confirmarExclusao"
      />
    </div>
  </div>
</template>
