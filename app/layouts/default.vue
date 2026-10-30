<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PublicoSelecao } from '#shared/publico'
import {
  contarSistemas,
  rotuloChamadas,
  rotuloManuais,
  rotuloSistemas
} from '#shared/publico'
import { carregarIdentidadeLogin } from '../composables/useLogomarcaLogin'
import { usePublicoNavegacao } from '../composables/usePublicoNavegacao'
import { useTemaPublico } from '../composables/useTemaPublico'

const { releases, manuais, escopos, carregando, erro, recarregar } = usePublicoNavegacao()
const { escuro } = useTemaPublico()

await carregarIdentidadeLogin()

const rota = useRoute()
const sidebarAberta = ref(false)
const mainRef = ref<HTMLElement | null>(null)
const selecao = useState<PublicoSelecao | null>('publico-selecao', () => null)

watch(
  () => rota.fullPath,
  () => {
    mainRef.value?.scrollTo({ top: 0 })
  }
)

const escopoDaRota = computed<{ escopoId: string; sistema: string | null } | null>(() => {
  if (!rota.path.startsWith('/escopos/')) return null
  const id = typeof rota.params.id === 'string' ? rota.params.id : ''
  if (!id) return null
  const sistema =
    typeof rota.query.sistema === 'string' ? rota.query.sistema.trim() : ''
  return { escopoId: id, sistema: sistema || null }
})

const selecionarRelease = (id: string) => {
  const release = releases.value.find((item) => item.id === id)
  if (!release) return
  selecao.value = {
    tipo: 'release',
    titulo: release.versao
      ? `Semana ${release.semana} · v${release.versao}`
      : `Semana ${release.semana}`,
    detalhe: `${rotuloChamadas(release.chamadas)}${release.release ? ` · Rel: ${release.release}` : ''}`
  }
  sidebarAberta.value = false
}

const selecionarManual = (payload: { ano: number; mes: string }) => {
  const doMes = manuais.value.filter(
    (item) => item.ano === payload.ano && item.mes === payload.mes
  )
  selecao.value = {
    tipo: 'manual',
    titulo: `Manuais de ${payload.mes}/${payload.ano}`,
    detalhe: rotuloManuais(doMes.length)
  }
  sidebarAberta.value = false
}

const selecionarEscopo = async (payload: { escopoId: string; sistema: string | null }) => {
  const escopo = escopos.value.find((item) => item.id === payload.escopoId)
  if (!escopo) return

  if (payload.sistema) {
    const sistema = escopo.sistemas.find((item) => item.nome === payload.sistema)
    selecao.value = {
      tipo: 'sistema',
      titulo: `${payload.sistema} · ${escopo.versao}`,
      detalhe: sistema ? rotuloChamadas(sistema.chamadas) : ''
    }
  } else {
    selecao.value = {
      tipo: 'escopo',
      titulo: `${escopo.versao} · ${escopo.nome}`,
      detalhe: `${rotuloSistemas(contarSistemas(escopo))} · ${rotuloChamadas(escopo.chamadas)}`
    }
  }
  sidebarAberta.value = false

  await navigateTo({
    path: `/escopos/${escopo.id}`,
    query: payload.sistema ? { sistema: payload.sistema } : {}
  })
}

const irHome = async () => {
  selecao.value = null
  sidebarAberta.value = false
  if (rota.path.startsWith('/escopos/')) {
    await navigateTo('/')
  }
}
</script>

<template>
  <div
    id="publico-shell"
    data-publico-shell
    :class="[
      'flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100',
      { dark: escuro }
    ]"
  >
    <LayoutPublicHeader
      :sidebar-aberta="sidebarAberta"
      @toggle-sidebar="sidebarAberta = !sidebarAberta"
    />

    <div class="flex min-h-0 flex-1 items-stretch">
      <LayoutPublicSidebar
        :releases="releases"
        :manuais="manuais"
        :escopos="escopos"
        :carregando="carregando"
        :erro="erro"
        :aberta="sidebarAberta"
        :escopo-inicial="escopoDaRota"
        @fechar="sidebarAberta = false"
        @recarregar="recarregar"
        @ir-home="irHome"
        @selecionar-release="selecionarRelease"
        @selecionar-manual="selecionarManual"
        @selecionar-escopo="selecionarEscopo"
      />

      <div
        v-if="sidebarAberta"
        class="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
        aria-hidden="true"
        @click="sidebarAberta = false"
      />

      <main
        ref="mainRef"
        class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
      >
        <slot />
      </main>
    </div>
  </div>
</template>
