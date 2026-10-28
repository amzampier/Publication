<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BookOpen, FolderGit2, Home, Rocket } from '@lucide/vue'
import type {
  PublicoEscopoResumo,
  PublicoManualResumo,
  PublicoReleaseResumo
} from '#shared/publico'
import {
  agruparManuais,
  agruparReleases,
  ordenarEscopos
} from '#shared/publico'
import PublicSidebarEscopos from './PublicSidebarEscopos.vue'
import PublicSidebarManuais from './PublicSidebarManuais.vue'
import PublicSidebarReleases from './PublicSidebarReleases.vue'
import PublicSidebarSecao from './PublicSidebarSecao.vue'

const props = withDefaults(
  defineProps<{
    releases?: PublicoReleaseResumo[]
    manuais?: PublicoManualResumo[]
    escopos?: PublicoEscopoResumo[]
    carregando?: boolean
    erro?: string
    aberta?: boolean
    demo?: boolean
  }>(),
  {
    releases: () => [],
    manuais: () => [],
    escopos: () => [],
    carregando: false,
    erro: '',
    aberta: false,
    demo: false
  }
)

const emit = defineEmits<{
  (e: 'fechar'): void
  (e: 'recarregar'): void
  (e: 'selecionar-release', id: string): void
  (e: 'selecionar-manual', payload: { ano: number; mes: string }): void
  (e: 'selecionar-escopo', payload: { escopoId: string; sistema: string | null }): void
  (e: 'ir-home'): void
}>()

const anosReleases = computed(() => agruparReleases(props.releases))
const anosManuais = computed(() => agruparManuais(props.manuais))
const escoposOrdenados = computed(() => ordenarEscopos(props.escopos))

const secoesAbertas = ref({ releases: true, manuais: true, escopos: true })

const releaseSelecionada = ref<string | null>(null)
const manualSelecionado = ref<{ ano: number; mes: string } | null>(null)
const escopoSelecionado = ref<{ escopoId: string; sistema: string | null } | null>(null)

const homeAtivo = computed(
  () =>
    !releaseSelecionada.value &&
    !manualSelecionado.value &&
    !escopoSelecionado.value
)

const alternarSecao = (secao: 'releases' | 'manuais' | 'escopos') => {
  secoesAbertas.value[secao] = !secoesAbertas.value[secao]
}

const irHome = () => {
  releaseSelecionada.value = null
  manualSelecionado.value = null
  escopoSelecionado.value = null
  emit('ir-home')
}

const selecionarRelease = (id: string) => {
  releaseSelecionada.value = id
  manualSelecionado.value = null
  escopoSelecionado.value = null
  emit('selecionar-release', id)
}

const selecionarManual = (payload: { ano: number; mes: string }) => {
  manualSelecionado.value = payload
  releaseSelecionada.value = null
  escopoSelecionado.value = null
  emit('selecionar-manual', payload)
}

const selecionarEscopo = (payload: { escopoId: string; sistema: string | null }) => {
  escopoSelecionado.value = payload
  releaseSelecionada.value = null
  manualSelecionado.value = null
  emit('selecionar-escopo', payload)
}

const asideRef = ref<HTMLElement | null>(null)
const ehMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
let focoAnterior: HTMLElement | null = null

const atualizarViewport = () => {
  ehMobile.value = mediaQuery?.matches ?? false
}

const drawerAtivo = computed(
  () => !props.demo && ehMobile.value && props.aberta
)

const focaveis = () =>
  Array.from(
    asideRef.value?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) ?? []
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)

const aoTeclado = (evento: KeyboardEvent) => {
  if (!drawerAtivo.value) return
  if (evento.key === 'Escape') {
    evento.preventDefault()
    emit('fechar')
    return
  }
  if (evento.key !== 'Tab') return
  const itens = focaveis()
  if (!itens.length) return
  const primeiro = itens[0]
  const ultimo = itens[itens.length - 1]
  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault()
    ultimo?.focus()
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault()
    primeiro?.focus()
  }
}

watch(drawerAtivo, async (aberto) => {
  if (aberto) {
    focoAnterior = document.activeElement as HTMLElement | null
    await nextTick()
    focaveis()[0]?.focus()
    return
  }
  focoAnterior?.focus()
  focoAnterior = null
})

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 1023px)')
  atualizarViewport()
  mediaQuery.addEventListener('change', atualizarViewport)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', atualizarViewport)
})
</script>

<template>
  <aside
    id="public-sidebar"
    ref="asideRef"
    :role="drawerAtivo ? 'dialog' : undefined"
    :aria-modal="drawerAtivo ? 'true' : undefined"
    :aria-label="drawerAtivo ? 'Navegação da Área Pública' : undefined"
    :inert="!demo && ehMobile && !aberta ? true : undefined"
    :class="[
      'flex w-72 shrink-0 select-none flex-col overflow-hidden border-r border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900',
      demo
        ? 'relative h-[620px]'
        : [
            'fixed top-16 bottom-0 left-0 z-30 transition-transform duration-200 lg:sticky lg:top-16 lg:bottom-auto lg:z-auto lg:h-[calc(100vh-4rem)]',
            aberta ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          ]
    ]"
    @keydown="aoTeclado"
  >
    <nav
      aria-label="Navegação da Área Pública"
      class="flex-1 space-y-6 overflow-y-auto p-4 scrollbar-discreta"
    >
      <div>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
          :class="
            homeAtivo
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
          "
          :aria-current="homeAtivo ? 'page' : undefined"
          @click="irHome"
        >
          <Home class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Painel de Destaques &amp; Busca</span>
        </button>
      </div>

      <div v-if="carregando" class="space-y-3" aria-live="polite">
        <span class="sr-only">Carregando navegação da Área Pública…</span>
        <div class="h-8 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
        <div class="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
        <div class="h-8 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
        <div class="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
      </div>

      <div
        v-else-if="erro"
        role="alert"
        class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
      >
        <p>{{ erro }}</p>
        <button
          type="button"
          class="mt-2 font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
          @click="$emit('recarregar')"
        >
          Tentar novamente
        </button>
      </div>

      <template v-else>
        <PublicSidebarSecao
          id="releases"
          titulo="Releases Week"
          :icone="Rocket"
          cor="text-indigo-600 dark:text-indigo-400"
          hover-cor="hover:text-indigo-600 dark:hover:text-indigo-400"
          :quantidade="releases.length"
          :aberta="secoesAbertas.releases"
          @toggle="alternarSecao('releases')"
        >
          <PublicSidebarReleases
            :anos="anosReleases"
            :selecionada="releaseSelecionada"
            @selecionar="selecionarRelease"
          />
        </PublicSidebarSecao>

        <PublicSidebarSecao
          id="manuais"
          titulo="Manuais Mensais"
          :icone="BookOpen"
          cor="text-emerald-600 dark:text-emerald-400"
          hover-cor="hover:text-emerald-700 dark:hover:text-emerald-400"
          :quantidade="manuais.length"
          :aberta="secoesAbertas.manuais"
          @toggle="alternarSecao('manuais')"
        >
          <PublicSidebarManuais
            :anos="anosManuais"
            :selecionado="manualSelecionado"
            @selecionar="selecionarManual"
          />
        </PublicSidebarSecao>

        <PublicSidebarSecao
          id="escopos"
          titulo="Escopo de Projetos"
          :icone="FolderGit2"
          cor="text-purple-600 dark:text-purple-400"
          hover-cor="hover:text-purple-700 dark:hover:text-purple-400"
          :quantidade="escoposOrdenados.length"
          :aberta="secoesAbertas.escopos"
          @toggle="alternarSecao('escopos')"
        >
          <PublicSidebarEscopos
            :escopos="escoposOrdenados"
            :selecionado="escopoSelecionado"
            @selecionar="selecionarEscopo"
          />
        </PublicSidebarSecao>
      </template>
    </nav>
  </aside>
</template>
