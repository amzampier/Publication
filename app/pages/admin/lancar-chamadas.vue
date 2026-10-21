<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import {
  useLancarChamadasModelo,
  type LinhaChamada
} from '../../components/lancar-chamadas/useLancarChamadasModelo'
import {
  motivoBloqueioAprovacao,
  motivoBloqueioExclusao,
  motivoBloqueioRecusa,
  type ChamadaModelo
} from '../../components/lancar-chamadas/validadores'

definePageMeta({ layout: 'admin' })

const carregando = ref(true)
const { toast } = useToast()
const {
  carregarChamadas,
  resolver,
  aprovar,
  recusar,
  excluir
} = useLancarChamadasModelo()

onMounted(async () => {
  const ok = await carregarChamadas()
  carregando.value = false
  if (!ok) {
    toast.danger(
      'Lançar as Chamadas',
      'Não foi possível carregar as chamadas. Recarregue a página e tente novamente.'
    )
  }
})

const filtrosAbertos = ref(false)

const formAberto = ref(false)
const modo = ref<'novo' | 'editar'>('novo')
const chamadaEditar = ref<ChamadaModelo | null>(null)

const abrirNovo = () => {
  modo.value = 'novo'
  chamadaEditar.value = null
  formAberto.value = true
}

const abrirEdicao = (linha: LinhaChamada) => {
  const registro = resolver(linha.id)
  if (!registro) return
  modo.value = 'editar'
  chamadaEditar.value = registro
  formAberto.value = true
}

const detalhesAberto = ref(false)
const chamadaDetalhes = ref<ChamadaModelo | null>(null)

const abrirDetalhes = (linha: LinhaChamada) => {
  const registro = resolver(linha.id)
  if (!registro) return
  chamadaDetalhes.value = registro
  detalhesAberto.value = true
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

const confirmarAprovacao = () => {
  const alvo = chamadaAprovar.value
  if (!alvo) return
  aprovarAberto.value = false
  chamadaAprovar.value = null
  const resultado = aprovar(alvo.id)
  if (resultado.ok) {
    toast.success('Lançar as Chamadas', 'Chamada aprovada com sucesso.')
  } else {
    toast.danger('Lançar as Chamadas', resultado.motivo ?? 'Não foi possível aprovar a chamada.')
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

const confirmarRecusa = () => {
  const alvo = chamadaRecusar.value
  if (!alvo) return
  recusarAberto.value = false
  chamadaRecusar.value = null
  const resultado = recusar(alvo.id)
  if (resultado.ok) {
    toast.success('Lançar as Chamadas', 'Chamada recusada com sucesso.')
  } else {
    toast.danger('Lançar as Chamadas', resultado.motivo ?? 'Não foi possível recusar a chamada.')
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

const confirmarExclusao = () => {
  const alvo = chamadaExcluir.value
  if (!alvo) return
  exclusaoAberta.value = false
  chamadaExcluir.value = null
  const resultado = excluir(alvo.id)
  if (resultado.ok) {
    toast.success('Lançar as Chamadas', 'Chamada excluída com sucesso.')
  } else {
    toast.danger('Lançar as Chamadas', resultado.motivo ?? 'Não foi possível excluir a chamada.')
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
        @recusar="abrirRecusa"
        @excluir="abrirExclusao"
        @open-filters="filtrosAbertos = true"
      />

      <LancarChamadasFiltros v-model="filtrosAbertos" />

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
