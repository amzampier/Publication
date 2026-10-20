<script setup lang="ts">
import { ref } from 'vue'
import {
  useEscopoProjetosModelo,
  type ModoEscopo,
  type ProjetoEscopoModelo
} from '../../components/escopo-projetos/useEscopoProjetosModelo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { escoposComSoftwares, publicar, arquivar, excluir } = useEscopoProjetosModelo()

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
  const registro = escoposComSoftwares.value.find((item) => item.id === escopo.id) ?? escopo
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

const confirmarExclusao = () => {
  const alvo = escopoExcluir.value
  if (!alvo) return

  exclusaoAberta.value = false
  escopoExcluir.value = null

  const resultado = excluir(alvo.id)
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

const confirmarPublicacao = () => {
  const alvo = escopoPublicar.value
  if (!alvo) return

  publicarAberto.value = false
  escopoPublicar.value = null

  if (publicar(alvo.id)) {
    toast.success('Escopo de Projetos', 'Escopo publicado com sucesso.')
  } else {
    toast.danger('Escopo de Projetos', 'Não foi possível publicar o escopo.')
  }
}

const arquivarAberto = ref(false)
const escopoArquivar = ref<ProjetoEscopoModelo | null>(null)

const abrirArquivamento = (escopo: ProjetoEscopoModelo) => {
  escopoArquivar.value = escopo
  arquivarAberto.value = true
}

const confirmarArquivamento = () => {
  const alvo = escopoArquivar.value
  if (!alvo) return

  arquivarAberto.value = false
  escopoArquivar.value = null

  if (arquivar(alvo.id)) {
    toast.success('Escopo de Projetos', 'Escopo arquivado com sucesso.')
  } else {
    toast.danger('Escopo de Projetos', 'Não foi possível arquivar o escopo.')
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl">
      <EscopoProjetosCabecalho @novo="abrirNovo" />

      <EscopoProjetosKpis class="mt-6" />

      <EscopoProjetosGrade
        class="mt-5"
        @editar="abrirEdicao"
        @excluir="abrirExclusao"
        @publicar="abrirPublicacao"
        @arquivar="abrirArquivamento"
        @ver-itens="abrirItens"
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
    </div>
  </div>
</template>
