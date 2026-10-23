<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  excluirParceiro,
  useParceirosModelo,
  type ModoParceiros,
  type ParceiroModelo
} from '../../components/parceiros/useParceirosModelo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { parceiros, carregarParceiros } = useParceirosModelo()
const { mensagem, limpar } = useErroCarga()
const erroCarga = ref('')

// Loading no F5 (padrão Softwares/Perfis/Usuários): `carregando` nasce true — o
// SSR renderiza só o overlay e o conteúdo só monta via v-else após a resposta,
// sem flash de KPIs/grade vazios. Em falha → toast de erro + lista vazia.
const carregando = ref(true)

const recarregar = async () => {
  carregando.value = true
  erroCarga.value = ''
  const ok = await carregarParceiros(true)
  carregando.value = false
  if (!ok) {
    erroCarga.value = mensagem('os parceiros')
    return
  }
  limpar()
}

onMounted(async () => {
  await recarregar()
  if (erroCarga.value) toast.danger('Parceiros', erroCarga.value)
})

// Coordenação do modal de filtros: a página é dona do estado.
const filtrosAbertos = ref(false)

// Coordenação do modal de cadastro/edição: a página é dona do estado.
const modalAberto = ref(false)
const modo = ref<ModoParceiros>('novo')
const parceiroEditar = ref<ParceiroModelo | null>(null)

const abrirNovo = () => {
  modo.value = 'novo'
  parceiroEditar.value = null
  modalAberto.value = true
}

const abrirEdicao = (parceiro: ParceiroModelo) => {
  // O modal precisa do registro completo (timestamps) — resolve por id na base.
  const registro = parceiros.value.find((p) => p.id === parceiro.id) ?? parceiro
  modo.value = 'editar'
  parceiroEditar.value = registro
  modalAberto.value = true
}

// Coordenação do modal de exclusão: a página é dona do estado e da gravação.
const exclusaoAberta = ref(false)
const parceiroExcluir = ref<ParceiroModelo | null>(null)

const abrirExclusao = (parceiro: ParceiroModelo) => {
  parceiroExcluir.value = parceiro
  exclusaoAberta.value = true
}

const confirmarExclusao = async () => {
  const alvo = parceiroExcluir.value
  if (!alvo) return

  exclusaoAberta.value = false
  parceiroExcluir.value = null

  try {
    const { base } = await excluirParceiro(parceiros.value, alvo.id)
    parceiros.value = base
    toast.success('Parceiros', 'Parceiro excluído com sucesso.')
  } catch (erro) {
    const status = (erro as { statusCode?: number }).statusCode
    if (status === 409) {
      toast.danger('Parceiros', 'O parceiro não pode ser excluído: existem entregas vinculadas a ele.')
    } else {
      toast.danger('Parceiros', 'Não foi possível excluir o parceiro. Tente novamente.')
    }
  }
}

// Coordenação do modal de importação: a página é dona do estado.
const importarAberto = ref(false)
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Loading no F5: enquanto o GET resolve, só o overlay (sem conteúdo parcial) -->
    <UiLoading v-if="carregando" message="Carregando parceiros…" />

    <div v-else class="mx-auto max-w-7xl">
      <ParceirosCabecalho @novo="abrirNovo" />

      <ParceirosKpis class="mt-6" />

      <UiErrorState
        v-if="erroCarga"
        class="mt-5"
        :message="erroCarga"
        :retrying="carregando"
        @retry="recarregar"
      />

      <ParceirosGrade
        v-else
        class="mt-5"
        @editar="abrirEdicao"
        @excluir="abrirExclusao"
        @importar="importarAberto = true"
        @open-filters="filtrosAbertos = true"
      />

      <ParceirosFiltros v-model="filtrosAbertos" />

      <ParceirosFormulario v-model="modalAberto" :modo="modo" :parceiro="parceiroEditar" />

      <ParceirosExclusao
        v-model="exclusaoAberta"
        :parceiro="parceiroExcluir"
        @confirmar="confirmarExclusao"
      />

      <ParceirosImportar v-model="importarAberto" />
    </div>
  </div>
</template>
