<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import {
  useLancarChamadasModelo,
  type LinhaChamada
} from '../../components/lancar-chamadas/useLancarChamadasModelo'
import {
  motivoBloqueioAprovacao,
  motivoBloqueioDesaprovacao,
  motivoBloqueioExclusao,
  motivoBloqueioRecusa,
  type ChamadaModelo
} from '../../components/lancar-chamadas/validadores'

definePageMeta({ layout: 'admin' })

const carregando = ref(true)
const { toast } = useToast()
const {
  carregarChamadas,
  buscarDetalhe,
  resolver,
  aprovar,
  desaprovar,
  recusar,
  excluir
} = useLancarChamadasModelo()

const mensagemErro = (erro: unknown): string => {
  const e = erro as {
    statusMessage?: string
    data?: { statusMessage?: string }
  }
  return e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível concluir a operação.'
}

onMounted(async () => {
  const ok = await carregarChamadas(true)
  carregando.value = false
  if (!ok) {
    toast.danger(
      'Lançar as Chamadas',
      'Não foi possível carregar as chamadas. Recarregue a página e tente novamente.'
    )
  }
})

const filtrosAbertos = ref(false)
const importarAberto = ref(false)

const formAberto = ref(false)
const modo = ref<'novo' | 'editar'>('novo')
const chamadaEditar = ref<ChamadaModelo | null>(null)

const abrirNovo = () => {
  modo.value = 'novo'
  chamadaEditar.value = null
  formAberto.value = true
}

const abrirEdicao = async (linha: LinhaChamada) => {
  try {
    const registro = await buscarDetalhe(linha.id)
    modo.value = 'editar'
    chamadaEditar.value = registro
    formAberto.value = true
  } catch (erro) {
    toast.danger('Lançar as Chamadas', mensagemErro(erro))
  }
}

const detalhesAberto = ref(false)
const chamadaDetalhes = ref<ChamadaModelo | null>(null)

const abrirDetalhes = async (linha: LinhaChamada) => {
  try {
    chamadaDetalhes.value = await buscarDetalhe(linha.id)
    detalhesAberto.value = true
  } catch (erro) {
    toast.danger('Lançar as Chamadas', mensagemErro(erro))
  }
}

const aprovarAberto = ref(false)
const chamadaAprovar = ref<ChamadaModelo | null>(null)

const abrirAprovacao = (linha: LinhaChamada) => {
  const registro = resolver(linha.id)
  if (!registro) return
  const motivo = motivoBloqueioAprovacao(registro)
  if (motivo) {
    toast.info('Lançar as Chamadas', motivo)
    return
  }
  chamadaAprovar.value = registro
  aprovarAberto.value = true
}

const confirmarAprovacao = async (payload: {
  parecer: string
  criterios: boolean
}) => {
  const alvo = chamadaAprovar.value
  if (!alvo) return
  try {
    await aprovar(alvo.id, payload)
    aprovarAberto.value = false
    chamadaAprovar.value = null
    toast.success('Lançar as Chamadas', 'Chamada aprovada com sucesso.')
  } catch (erro) {
    toast.danger('Lançar as Chamadas', mensagemErro(erro))
  }
}

const desaprovarAberto = ref(false)
const chamadaDesaprovar = ref<ChamadaModelo | null>(null)

const abrirDesaprovacao = (linha: LinhaChamada) => {
  const registro = resolver(linha.id)
  if (!registro) return
  const motivo = motivoBloqueioDesaprovacao(registro)
  if (motivo) {
    toast.info('Lançar as Chamadas', motivo)
    return
  }
  chamadaDesaprovar.value = registro
  desaprovarAberto.value = true
}

const confirmarDesaprovacao = async (payload: { parecer: string }) => {
  const alvo = chamadaDesaprovar.value
  if (!alvo) return
  try {
    await desaprovar(alvo.id, payload)
    desaprovarAberto.value = false
    chamadaDesaprovar.value = null
    toast.success('Lançar as Chamadas', 'Chamada devolvida para Revisar.')
  } catch (erro) {
    toast.danger('Lançar as Chamadas', mensagemErro(erro))
  }
}

const recusarAberto = ref(false)
const chamadaRecusar = ref<ChamadaModelo | null>(null)

const abrirRecusa = (linha: LinhaChamada) => {
  const registro = resolver(linha.id)
  if (!registro) return
  const motivo = motivoBloqueioRecusa(registro)
  if (motivo) {
    toast.info('Lançar as Chamadas', motivo)
    return
  }
  chamadaRecusar.value = registro
  recusarAberto.value = true
}

const confirmarRecusa = async (payload: {
  parecer: string
  criterios: boolean
}) => {
  const alvo = chamadaRecusar.value
  if (!alvo) return
  try {
    await recusar(alvo.id, payload)
    recusarAberto.value = false
    chamadaRecusar.value = null
    toast.success('Lançar as Chamadas', 'Chamada recusada com sucesso.')
  } catch (erro) {
    toast.danger('Lançar as Chamadas', mensagemErro(erro))
  }
}

const exclusaoAberta = ref(false)
const chamadaExcluir = ref<ChamadaModelo | null>(null)

const abrirExclusao = (linha: LinhaChamada) => {
  const registro = resolver(linha.id)
  if (!registro) return
  const motivo = motivoBloqueioExclusao(registro)
  if (motivo) {
    toast.danger('Lançar as Chamadas', motivo)
    return
  }
  chamadaExcluir.value = registro
  exclusaoAberta.value = true
}

const confirmarExclusao = async () => {
  const alvo = chamadaExcluir.value
  if (!alvo) return
  try {
    await excluir(alvo.id)
    exclusaoAberta.value = false
    chamadaExcluir.value = null
    toast.success('Lançar as Chamadas', 'Chamada excluída com sucesso.')
  } catch (erro) {
    toast.danger('Lançar as Chamadas', mensagemErro(erro))
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:px-1 lg:py-8">
    <UiLoading v-if="carregando" message="Carregando chamadas…" />

    <div v-else class="mx-auto max-w-[85rem]">
      <LancarChamadasCabecalho @novo="abrirNovo" />

      <LancarChamadasKpis class="mt-6" />

      <LancarChamadasTabela
        class="mt-5"
        @detalhes="abrirDetalhes"
        @editar="abrirEdicao"
        @aprovar="abrirAprovacao"
        @desaprovar="abrirDesaprovacao"
        @recusar="abrirRecusa"
        @excluir="abrirExclusao"
        @importar="importarAberto = true"
        @open-filters="filtrosAbertos = true"
      />

      <LancarChamadasFiltros v-model="filtrosAbertos" />

      <LancarChamadasImportar v-model="importarAberto" />

      <LancarChamadasFormulario
        v-model="formAberto"
        :modo="modo"
        :chamada="chamadaEditar"
      />

      <LancarChamadasDetalhes
        v-model="detalhesAberto"
        :chamada="chamadaDetalhes"
      />

      <LancarChamadasAprovar
        v-model="aprovarAberto"
        :chamada="chamadaAprovar"
        @confirmar="confirmarAprovacao"
      />

      <LancarChamadasDesaprovar
        v-model="desaprovarAberto"
        :chamada="chamadaDesaprovar"
        @confirmar="confirmarDesaprovacao"
      />

      <LancarChamadasRecusar
        v-model="recusarAberto"
        :chamada="chamadaRecusar"
        @confirmar="confirmarRecusa"
      />

      <LancarChamadasExclusao
        v-model="exclusaoAberta"
        :chamada="chamadaExcluir"
        @confirmar="confirmarExclusao"
      />
    </div>
  </div>
</template>
