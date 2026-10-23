<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import {
  useEsteiraRevisaoModelo,
  type LinhaEsteira
} from '../../components/esteira/useEsteiraRevisaoModelo'
import {
  podeTransicionar,
  type AcaoEsteira,
  type ItemEsteira
} from '../../components/esteira/validadores'

definePageMeta({ layout: 'admin' })

const carregando = ref(true)
const { toast } = useToast()
const { mensagem: mensagemCarga, limpar } = useErroCarga()
const erroCarga = ref('')
const {
  carregar,
  resolver,
  aprovar,
  recusar,
  reabrir,
  publicar,
  suspender
} = useEsteiraRevisaoModelo()

const mensagemErro = (erro: unknown): string => {
  const e = erro as {
    statusMessage?: string
    data?: { statusMessage?: string }
  }
  return e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível concluir a operação.'
}

const recarregar = async () => {
  carregando.value = true
  erroCarga.value = ''
  const ok = await carregar(true)
  carregando.value = false
  if (!ok) {
    erroCarga.value = mensagemCarga('a esteira de revisão')
    return
  }
  limpar()
}

onMounted(async () => {
  await recarregar()
  if (erroCarga.value) toast.danger('Esteira de Revisão', erroCarga.value)
})

const filtrosAbertos = ref(false)

const detalheAberto = ref(false)
const itemDetalhe = ref<ItemEsteira | null>(null)

const abrirDetalhes = (linha: LinhaEsteira) => {
  const item = resolver(linha.id)
  if (!item) return
  itemDetalhe.value = item
  detalheAberto.value = true
}

const decisaoAberta = ref(false)
const itemDecisao = ref<ItemEsteira | null>(null)
const acaoDecisao = ref<AcaoEsteira>('aprovar')

const motivoTransicao = (status: ItemEsteira['status'], acao: AcaoEsteira): string => {
  if (podeTransicionar(status, acao)) return ''
  if (acao === 'aprovar') return 'Somente chamadas em Revisar podem ser aprovadas.'
  if (acao === 'recusar') return 'Somente chamadas em Revisar podem ser recusadas.'
  if (acao === 'publicar') return 'Somente chamadas aprovadas podem ser publicadas.'
  if (acao === 'suspender') return 'Somente chamadas publicadas podem ser suspensas.'
  return 'Somente chamadas aprovadas ou recusadas podem ser reabertas.'
}

const abrirDecisao = (linha: LinhaEsteira, acao: AcaoEsteira) => {
  const item = resolver(linha.id)
  if (!item) return
  const motivo = motivoTransicao(item.status, acao)
  if (motivo) {
    toast.info('Esteira de Revisão', motivo)
    return
  }
  itemDecisao.value = item
  acaoDecisao.value = acao
  decisaoAberta.value = true
}

const confirmarDecisao = async (payload: {
  acao: AcaoEsteira
  parecer: string
  criterios: boolean
}) => {
  const item = itemDecisao.value
  if (!item) return
  decisaoAberta.value = false
  itemDecisao.value = null
  try {
    if (payload.acao === 'aprovar') {
      await aprovar(item.id, { parecer: payload.parecer, criterios: payload.criterios })
      toast.success('Esteira de Revisão', 'Chamada aprovada com sucesso.')
    } else if (payload.acao === 'recusar') {
      await recusar(item.id, { parecer: payload.parecer, criterios: payload.criterios })
      toast.success('Esteira de Revisão', 'Chamada recusada com sucesso.')
    } else if (payload.acao === 'publicar') {
      await publicar(item.id, { parecer: payload.parecer })
      toast.success('Esteira de Revisão', 'Chamada publicada no portal.')
    } else if (payload.acao === 'suspender') {
      await suspender(item.id, { parecer: payload.parecer })
      toast.success('Esteira de Revisão', 'Chamada suspensa para homologação.')
    } else {
      await reabrir(item.id, { parecer: payload.parecer })
      toast.success('Esteira de Revisão', 'Chamada reaberta e devolvida para Revisão.')
    }
    if (itemDetalhe.value?.id === item.id) {
      itemDetalhe.value = resolver(item.id)
    }
  } catch (erro) {
    toast.danger('Esteira de Revisão', mensagemErro(erro))
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:px-1 lg:py-8">
    <UiLoading v-if="carregando" message="Carregando a Esteira de Revisão..." />

    <div v-else class="mx-auto max-w-[85rem]">
      <EsteiraCabecalho />

      <EsteiraKpis class="mt-4" />

      <UiErrorState
        v-if="erroCarga"
        class="mt-4"
        :message="erroCarga"
        :retrying="carregando"
        @retry="recarregar"
      />

      <EsteiraBoard
        v-else
        class="mt-4"
        @detalhes="abrirDetalhes"
        @aprovar="abrirDecisao($event, 'aprovar')"
        @recusar="abrirDecisao($event, 'recusar')"
        @reabrir="abrirDecisao($event, 'reabrir')"
        @publicar="abrirDecisao($event, 'publicar')"
        @suspender="abrirDecisao($event, 'suspender')"
        @open-filters="filtrosAbertos = true"
      />

      <EsteiraFiltros v-model="filtrosAbertos" />

      <EsteiraDetalhe v-model="detalheAberto" :item="itemDetalhe" />

      <EsteiraDecisao
        v-model="decisaoAberta"
        :item="itemDecisao"
        :acao="acaoDecisao"
        @confirmar="confirmarDecisao"
      />
    </div>
  </div>
</template>
