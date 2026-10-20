<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import {
  motivoBloqueioExclusao,
  useManuaisModelo,
  type LinhaManual,
  type ManuaisModelo
} from '../../components/manuais/useManuaisModelo'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const {
  manuais,
  carregarManuais,
  itensDoManual,
  clonarPreenchimento,
  publicar,
  arquivar,
  excluir
} = useManuaisModelo()

// A fase frontend opera sobre o dataset em memória; não há espera de rede na
// montagem. O `carregarManuais` mantém o mesmo contrato dos módulos de API e
// será o ponto de troca para `GET /api/manuais` na fase backend.
onMounted(() => {
  void carregarManuais()
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

const confirmarPublicacao = () => {
  const alvo = manualPublicar.value
  if (!alvo) return
  publicarAberto.value = false
  manualPublicar.value = null
  if (publicar(alvo.id)) {
    toast.success('Manuais Mensais', 'Manual publicado com sucesso.')
  } else {
    toast.danger('Manuais Mensais', 'Não foi possível publicar o manual.')
  }
}

const arquivarAberto = ref(false)
const manualArquivar = ref<LinhaManual | null>(null)

const abrirArquivamento = (linha: LinhaManual) => {
  manualArquivar.value = linha
  arquivarAberto.value = true
}

const confirmarArquivamento = () => {
  const alvo = manualArquivar.value
  if (!alvo) return
  arquivarAberto.value = false
  manualArquivar.value = null
  if (arquivar(alvo.id)) {
    toast.success('Manuais Mensais', 'Manual arquivado com sucesso.')
  } else {
    toast.danger('Manuais Mensais', 'Não foi possível arquivar o manual.')
  }
}

const exclusaoAberta = ref(false)
const manualExcluir = ref<LinhaManual | null>(null)

const abrirExclusao = (linha: LinhaManual) => {
  const registro = resolver(linha)
  if (!registro) return
  const motivo = motivoBloqueioExclusao(registro, itensDoManual(registro.id))
  if (motivo) {
    toast.danger('Manuais Mensais', motivo)
    return
  }
  manualExcluir.value = linha
  exclusaoAberta.value = true
}

const confirmarExclusao = () => {
  const alvo = manualExcluir.value
  if (!alvo) return
  exclusaoAberta.value = false
  manualExcluir.value = null
  const resultado = excluir(alvo.id)
  if (resultado.ok) {
    toast.success('Manuais Mensais', 'Manual excluído com sucesso.')
    // O gatilho (menu) saiu do DOM com a linha: devolve o foco à busca.
    nextTick(() => tabelaRef.value?.focarBusca())
  } else {
    toast.danger('Manuais Mensais', resultado.motivo ?? 'Não foi possível excluir o manual.')
  }
}

const aoImportar = () => {
  toast.info(
    'Importação',
    'A importação de Manuais Mensais estará disponível na fase backend.'
  )
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl">
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
        @importar="aoImportar"
        @open-filters="filtrosAbertos = true"
      />

      <ManuaisFiltros v-model="filtrosAbertos" />

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
