<script setup lang="ts">
import { ref } from 'vue'
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

const sidebarAberta = ref(false)
const selecao = useState<PublicoSelecao | null>('publico-selecao', () => null)

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

const selecionarEscopo = (payload: { escopoId: string; sistema: string | null }) => {
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
}

const irHome = () => {
  selecao.value = null
  sidebarAberta.value = false
}
</script>

<template>
  <div
    id="publico-shell"
    data-publico-shell
    :class="[
      'min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100',
      { dark: escuro }
    ]"
  >
    <LayoutPublicHeader
      :sidebar-aberta="sidebarAberta"
      @toggle-sidebar="sidebarAberta = !sidebarAberta"
    />

    <div class="flex items-start">
      <LayoutPublicSidebar
        :releases="releases"
        :manuais="manuais"
        :escopos="escopos"
        :carregando="carregando"
        :erro="erro"
        :aberta="sidebarAberta"
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

      <main class="min-w-0 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
