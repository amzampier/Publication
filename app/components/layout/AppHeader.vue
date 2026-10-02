<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  Bell,
  Building2,
  ChevronDown as ChevronDownIcon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2
} from '@lucide/vue'
import type { Notificacao } from '../../config/navigation'
import { useLogomarcaHeader } from '../../composables/useLogomarcaHeader'
import {
  accountEncerrarSessao,
  accountMeuPerfil,
  accountMenuItens,
  conta,
  notificacoesIniciais
} from '../../config/navigation'

// Logo escolhida em Configurações > Logomarcas (estado em memória, fase 1)
const { preview: logomarcaHeader } = useLogomarcaHeader()

const props = withDefaults(defineProps<{ sidebarOpen: boolean }>(), { sidebarOpen: true })
const emit = defineEmits<{ 'update:sidebarOpen': [value: boolean] }>()

const contaRef = ref<HTMLElement | null>(null)
const notificacoesRef = ref<HTMLElement | null>(null)
const contaAberto = ref(false)
const notificacoesAberto = ref(false)
const notificacoes = ref<Notificacao[]>([...notificacoesIniciais])

const iniciais = conta.nome
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte[0])
  .join('')
  .toUpperCase()

const alternarSidebar = () => emit('update:sidebarOpen', !props.sidebarOpen)

const alternarConta = () => {
  contaAberto.value = !contaAberto.value
  if (contaAberto.value) notificacoesAberto.value = false
}

const alternarNotificacoes = () => {
  notificacoesAberto.value = !notificacoesAberto.value
  if (notificacoesAberto.value) contaAberto.value = false
}

const fecharMenus = () => {
  contaAberto.value = false
  notificacoesAberto.value = false
}

// Item do menu Account com rota navega e fecha os menus
const clicarItemMenu = (item: { to?: string }) => {
  if (item.to) navigateTo(item.to)
  fecharMenus()
}

// Visualizar = dispensar a notificação da lista (mock sem rotas)
const visualizarNotificacao = (id: string) => {
  notificacoes.value = notificacoes.value.filter((notificacao) => notificacao.id !== id)
}

const limparNotificacoes = () => {
  notificacoes.value = []
}

const fecharMenuSeFora = (evento: PointerEvent) => {
  const alvo = evento.target as Node
  if (contaAberto.value && contaRef.value && !contaRef.value.contains(alvo)) {
    contaAberto.value = false
  }
  if (notificacoesAberto.value && notificacoesRef.value && !notificacoesRef.value.contains(alvo)) {
    notificacoesAberto.value = false
  }
}

const fecharMenuComEscape = (evento: KeyboardEvent) => {
  if (evento.key === 'Escape') fecharMenus()
}

onMounted(() => {
  document.addEventListener('pointerdown', fecharMenuSeFora)
  document.addEventListener('keydown', fecharMenuComEscape)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', fecharMenuSeFora)
  document.removeEventListener('keydown', fecharMenuComEscape)
})
</script>

<template>
  <header
    class="h-16 flex items-center justify-between px-4 shrink-0 relative z-40 bg-white border-b border-slate-200 text-slate-900"
  >
    <!-- Zona esquerda: alternância + separador + logo -->
    <div class="flex items-center min-w-0">
      <button
        type="button"
        class="mr-3 hover:opacity-75 transition-opacity p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
        :aria-label="sidebarOpen ? 'Recolher sidebar' : 'Expandir sidebar'"
        :aria-expanded="sidebarOpen"
        aria-controls="app-sidebar"
        @click="alternarSidebar"
      >
        <PanelLeftClose v-if="sidebarOpen" class="h-4 w-4" aria-hidden="true" />
        <PanelLeftOpen v-else class="h-4 w-4" aria-hidden="true" />
      </button>

      <span class="w-px h-5 bg-slate-200 shrink-0" aria-hidden="true"></span>

      <div class="flex items-center gap-2 min-w-0 ml-3">
        <img
          v-if="logomarcaHeader"
          :src="logomarcaHeader"
          alt="Logomarca do sistema"
          class="h-8 max-w-[180px] object-contain shrink-0"
        />
        <template v-else>
          <span class="p-1.5 rounded-md bg-brand-primary/10 text-brand-primary shrink-0">
            <Building2 class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="text-sm font-bold tracking-tight truncate">Publications</span>
        </template>
      </div>
    </div>

    <!-- Zona direita: notificações + conta -->
    <div class="flex items-center gap-2.5 shrink-0">
      <!-- Central de notificações -->
      <div ref="notificacoesRef" class="relative">
        <button
          type="button"
          class="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
          aria-label="Central de notificações"
          aria-haspopup="menu"
          :aria-expanded="notificacoesAberto"
          @click="alternarNotificacoes"
        >
          <Bell class="h-4 w-4" aria-hidden="true" />
          <span
            v-if="notificacoes.length > 0"
            class="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500"
            aria-hidden="true"
          ></span>
        </button>

        <div
          v-if="notificacoesAberto"
          role="menu"
          aria-label="Notificações"
          class="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-30 overflow-hidden"
        >
          <div class="px-3 py-2 bg-brand-primary flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-white">Central de Notificações</span>
            <span class="text-[10px] text-slate-300 tabular-nums">
              {{ notificacoes.length }} {{ notificacoes.length === 1 ? 'nova' : 'novas' }}
            </span>
          </div>

          <div class="max-h-64 overflow-y-auto scrollbar-discreta bg-[#f9feee]">
            <template v-if="notificacoes.length > 0">
              <button
                v-for="notificacao in notificacoes"
                :key="notificacao.id"
                type="button"
                role="menuitem"
                class="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-100 transition-colors"
                @click="visualizarNotificacao(notificacao.id)"
              >
                <span class="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-accent shrink-0" aria-hidden="true"></span>
                <span class="min-w-0">
                  <span class="block text-xs font-medium">{{ notificacao.titulo }}</span>
                  <span class="block text-[11px] font-light text-slate-600 leading-snug mt-0.5">
                    {{ notificacao.mensagem }}
                  </span>
                  <span class="block text-[10px] font-light text-slate-500 mt-1">{{ notificacao.tempo }}</span>
                </span>
              </button>
            </template>
            <p v-else class="px-3 py-7 text-center text-xs font-light text-slate-500">
              Nenhuma notificação nova.
            </p>
          </div>

          <div class="border-t border-slate-200 px-2 py-1.5 flex justify-end">
            <button
              type="button"
              role="menuitem"
              class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-light text-[#0f7a06] hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              :disabled="notificacoes.length === 0"
              @click="limparNotificacoes"
            >
              <Trash2 class="h-3 w-3" aria-hidden="true" />
              Limpar tudo
            </button>
          </div>
        </div>
      </div>

      <!-- Bloco Account -->
      <div ref="contaRef" class="relative">
        <button
          type="button"
          class="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
          aria-haspopup="menu"
          :aria-expanded="contaAberto"
          @click="alternarConta"
        >
          <span class="h-7 w-7 rounded-full overflow-hidden bg-brand-structure flex items-center justify-center shrink-0">
            <span class="text-[10px] font-bold text-slate-950">{{ iniciais }}</span>
          </span>
          <span class="text-left leading-tight hidden sm:block">
            <span class="block text-xs font-normal">{{ conta.nome }}</span>
            <span class="block text-[10px] font-normal">{{ conta.perfil }}</span>
          </span>
          <ChevronDownIcon
            class="h-3.5 w-3.5 transition-transform duration-200"
            :class="contaAberto ? 'rotate-180' : 'rotate-0'"
            aria-hidden="true"
          />
        </button>

        <div
          v-if="contaAberto"
          role="menu"
          aria-label="Menu da conta"
          class="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30"
        >
          <!-- Meu Perfil -->
          <button
            type="button"
            role="menuitem"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light text-slate-700 hover:bg-slate-100 transition-colors text-left"
            @click="fecharMenus"
          >
            <component :is="accountMeuPerfil.icon" class="h-3.5 w-3.5 shrink-0 ds-icon-light" aria-hidden="true" />
            {{ accountMeuPerfil.label }}
          </button>

          <div class="my-1 h-px bg-slate-200" role="separator"></div>

          <button
            v-for="item in accountMenuItens"
            :key="item.label"
            type="button"
            role="menuitem"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light text-slate-700 hover:bg-slate-100 ds-item-hover-dark transition-colors text-left"
            :style="item.cor ? { '--item-cor': item.cor } : undefined"
            @click="clicarItemMenu(item)"
          >
            <component
              :is="item.icon"
              class="h-3.5 w-3.5 shrink-0 ds-icon-light"
              :style="item.cor ? { color: item.cor } : undefined"
              aria-hidden="true"
            />
            {{ item.label }}
          </button>

          <div class="my-1 h-px bg-slate-200" role="separator"></div>

          <button
            type="button"
            role="menuitem"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-light hover:bg-slate-100 transition-colors text-left"
            @click="fecharMenus"
          >
            <component
              :is="accountEncerrarSessao.icon"
              class="h-3.5 w-3.5 shrink-0 ds-icon-light"
              :style="accountEncerrarSessao.cor ? { color: accountEncerrarSessao.cor } : undefined"
              aria-hidden="true"
            />
            <span :style="accountEncerrarSessao.cor ? { color: accountEncerrarSessao.cor } : undefined">
              {{ accountEncerrarSessao.label }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
