<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  useEscopoProjetosModelo,
  type ModoEscopo,
  type ProjetoEscopoModelo
} from '../../components/escopo-projetos/useEscopoProjetosModelo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { escopos, carregarEscopos, publicar, arquivar, excluir } =
  useEscopoProjetosModelo()

// Overlay já no SSR/F5: nasce true, cobre o primeiro GET e só libera a tela
// depois que a API responde (mesmo padrão de Manuais/Parceiros).
const carregando = ref(true)

const mensagemErro = (erro: unknown, padrao: string): string => {
  const e = erro as { statusMessage?: string; data?: { statusMessage?: string } } | null
  return e?.data?.statusMessage ?? e?.statusMessage ?? padrao
}

onMounted(async () => {
  carregando.value = true
  const ok = await carregarEscopos()
  carregando.value = false
  if (!ok) {
    toast.danger(
      'Escopo de Projetos',
      'Não foi possível carregar os escopos. Recarregue a página e tente novamente.'
    )
  }
})

// Coordenação dos modais: a página é dona do estado.
const filtrosAbertos = ref(false)

const modalAberto = ref(false)
const modo = ref<ModoEscopo>('novo')
const escopoEditar = ref<ProjetoEscopoModelo | null>(null)

const abrirNovo = () => {
  modo.value = 'novo'
  escopoEditar.value = null
  modalAberto.value = true
}

const abrirEdicao = (escopo: ProjetoEscopoModelo) => {
  const registro = escopos.value.find((item) => item.id === escopo.id) ?? escopo
  modo.value = 'editar'
  escopoEditar.value = registro
  modalAberto.value = true
}

const itensAberto = ref(false)
const escopoItens = ref<ProjetoEscopoModelo | null>(null)

const abrirItens = (escopo: ProjetoEscopoModelo) => {
  escopoItens.value = escopo
  itensAberto.value = true
}

const exclusaoAberta = ref(false)
const escopoExcluir = ref<ProjetoEscopoModelo | null>(null)

const abrirExclusao = (escopo: ProjetoEscopoModelo) => {
  escopoExcluir.value = escopo
  exclusaoAberta.value = true
}

const confirmarExclusao = async () => {
  const alvo = escopoExcluir.value
  if (!alvo) return

  exclusaoAberta.value = false
  escopoExcluir.value = null

  const resultado = await excluir(alvo.id)
  if (resultado.ok) {
    toast.success('Escopo de Projetos', 'Escopo excluído com sucesso.')
  } else {
    toast.danger('Escopo de Projetos', resultado.motivo ?? 'Não foi possível excluir o escopo.')
  }
}

const publicarAberto = ref(false)
const escopoPublicar = ref<ProjetoEscopoModelo | null>(null)

const abrirPublicacao = (escopo: ProjetoEscopoModelo) => {
  escopoPublicar.value = escopo
  publicarAberto.value = true
}

const confirmarPublicacao = async () => {
  const alvo = escopoPublicar.value
  if (!alvo) return

  publicarAberto.value = false
  escopoPublicar.value = null

  try {
    await publicar(alvo.id)
    toast.success('Escopo de Projetos', 'Escopo publicado com sucesso.')
  } catch (erro) {
    toast.danger('Escopo de Projetos', mensagemErro(erro, 'Não foi possível publicar o escopo.'))
  }
}

const arquivarAberto = ref(false)
const escopoArquivar = ref<ProjetoEscopoModelo | null>(null)

const abrirArquivamento = (escopo: ProjetoEscopoModelo) => {
  escopoArquivar.value = escopo
  arquivarAberto.value = true
}

const confirmarArquivamento = async () => {
  const alvo = escopoArquivar.value
  if (!alvo) return

  arquivarAberto.value = false
  escopoArquivar.value = null

  try {
    await arquivar(alvo.id)
    toast.success('Escopo de Projetos', 'Escopo arquivado com sucesso.')
  } catch (erro) {
    toast.danger('Escopo de Projetos', mensagemErro(erro, 'Não foi possível arquivar o escopo.'))
  }
}

const importarAberto = ref(false)
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <UiLoading v-if="carregando" message="Carregando escopos…" />

    <div v-else class="mx-auto max-w-7xl">
      <EscopoProjetosCabecalho @novo="abrirNovo" />

      <EscopoProjetosKpis class="mt-6" />

      <EscopoProjetosGrade
        class="mt-5"
        @editar="abrirEdicao"
        @excluir="abrirExclusao"
        @publicar="abrirPublicacao"
        @arquivar="abrirArquivamento"
        @ver-itens="abrirItens"
        @importar="importarAberto = true"
        @open-filters="filtrosAbertos = true"
      />

      <EscopoProjetosFiltros v-model="filtrosAbertos" />

      <EscopoProjetosFormulario v-model="modalAberto" :modo="modo" :escopo="escopoEditar" />

      <EscopoProjetosItens v-model="itensAberto" :escopo="escopoItens" />

      <EscopoProjetosExclusao
        v-model="exclusaoAberta"
        :escopo="escopoExcluir"
        @confirmar="confirmarExclusao"
      />

      <EscopoProjetosPublicar
        v-model="publicarAberto"
        :escopo="escopoPublicar"
        @confirmar="confirmarPublicacao"
      />

      <EscopoProjetosArquivar
        v-model="arquivarAberto"
        :escopo="escopoArquivar"
        @confirmar="confirmarArquivamento"
      />

      <EscopoProjetosImportar v-model="importarAberto" />
    </div>
  </div>
</template>
