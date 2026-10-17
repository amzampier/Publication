<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import {
  excluirSoftware,
  useSoftwaresModelo,
  type LinhaSoftware,
  type ModoSoftwares,
  type SoftwareModelo
} from '../../components/softwares/useSoftwaresModelo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { softwares, carregarSoftwares } = useSoftwaresModelo()

// Loading no F5 (padrão Perfis/Usuários): `carregando` nasce true — o SSR
// renderiza só o overlay e o conteúdo só monta via v-else após a resposta, sem
// flash de KPIs/tabela vazios. Carga inicial pela API (spec softwares): falha →
// toast de erro + lista vazia; nenhuma base de demonstração aparece fingindo
// ser persistida.
const carregando = ref(true)

onMounted(async () => {
  carregando.value = true
  const ok = await carregarSoftwares()
  carregando.value = false
  if (!ok) {
    toast.danger(
      'Softwares',
      'Não foi possível carregar os softwares. Recarregue a página e tente novamente.'
    )
  }
})

// Coordenação do modal de filtros: a página é dona do estado (molde Perfis/Usuários).
const filtrosAbertos = ref(false)

// Coordenação do modal de cadastro/edição: a página é dona do estado.
const modalAberto = ref(false)
const modo = ref<ModoSoftwares>('novo')
const softwareEditar = ref<SoftwareModelo | null>(null)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)

const abrirNovo = () => {
  modo.value = 'novo'
  softwareEditar.value = null
  modalAberto.value = true
}

const abrirEdicao = (linha: LinhaSoftware) => {
  // O modal precisa do registro completo (timestamps) — resolve por código na base.
  const registro = softwares.value.find((s) => s.codigo === linha.codigo)
  if (!registro) return
  modo.value = 'editar'
  softwareEditar.value = registro
  modalAberto.value = true
}

// Coordenação do modal de exclusão: a página é dona do estado e da gravação.
const exclusaoAberta = ref(false)
const softwareExcluir = ref<LinhaSoftware | null>(null)

const abrirExclusao = (linha: LinhaSoftware) => {
  softwareExcluir.value = linha
  exclusaoAberta.value = true
}

const confirmarExclusao = async () => {
  const alvo = softwareExcluir.value
  if (!alvo) return

  exclusaoAberta.value = false
  softwareExcluir.value = null

  try {
    const { base } = await excluirSoftware(softwares.value, alvo.codigo)
    softwares.value = base
    toast.success('Softwares', 'Software excluído com sucesso.')
    // O gatilho (Trash2) saiu do DOM com a linha: devolve o foco à busca.
    nextTick(() => tabelaRef.value?.focarBusca())
  } catch {
    toast.danger('Softwares', 'Não foi possível excluir o software. Tente novamente.')
  }
}

// Coordenação do modal de importação: a página é dona do estado (molde Usuários).
const importarAberto = ref(false)
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Loading no F5: enquanto o GET resolve, só o overlay (sem conteúdo parcial) -->
    <UiLoading v-if="carregando" message="Carregando softwares…" />

    <div v-else class="mx-auto max-w-7xl">
      <SoftwaresCabecalho @novo="abrirNovo" />

      <SoftwaresKpis class="mt-6" />

      <SoftwaresTabela
        ref="tabelaRef"
        class="mt-5"
        @editar="abrirEdicao"
        @excluir="abrirExclusao"
        @importar="importarAberto = true"
        @open-filters="filtrosAbertos = true"
      />

      <SoftwaresFiltros v-model="filtrosAbertos" />

      <SoftwaresFormulario
        v-model="modalAberto"
        :modo="modo"
        :software="softwareEditar"
      />

      <SoftwaresExclusao
        v-model="exclusaoAberta"
        :software="softwareExcluir"
        @confirmar="confirmarExclusao"
      />

      <SoftwaresImportar v-model="importarAberto" />
    </div>
  </div>
</template>
