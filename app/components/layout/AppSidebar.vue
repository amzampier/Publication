<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown as ChevronDownIcon } from '@lucide/vue'
import type { SidebarItem, SidebarSession } from '../../config/navigation'
import { itemRaiz, sessoes as sessoesDefinidas } from '../../config/navigation'
import { useSessoesAbertas } from '../../composables/useSessoesAbertas'

defineProps<{ sidebarOpen: boolean }>()

// Estado compartilhado com Configurações > Sidebar: as sessões refletem a preferência
// em tempo real (e os cliques aqui atualizam a preferência — fonte única em memória).
const { abertas: sessoesAbertas } = useSessoesAbertas()

const sessoes = computed<SidebarSession[]>(() =>
  sessoesDefinidas.map((sessao) => ({
    ...sessao,
    aberto: sessoesAbertas.value[sessao.label] ?? sessao.aberto,
    items: [...sessao.items]
  }))
)

const route = useRoute()

const todosItens = computed<SidebarItem[]>(() => [
  itemRaiz,
  ...sessoes.value.flatMap((sessao) => sessao.items)
])

const itemAtivo = ref<string>(itemRaiz.id)

// Deriva o item ativo da rota (só quando a URL casa com um item que tem `to`),
// com fallback no ref local para itens sem rota e para cliques que não navegam.
watch(
  () => route.path,
  (caminho) => {
    const alvo = todosItens.value.find((item) => item.to && item.to === caminho)
    if (alvo) itemAtivo.value = alvo.id
  },
  { immediate: true }
)

const clicarItem = (item: SidebarItem) => {
  itemAtivo.value = item.id
  if (item.to) navigateTo(item.to)
}

const sessoesVisiveis = computed(() => sessoes.value.filter((sessao) => sessao.items.length > 0))

const alternarSessao = (sessao: SidebarSession) => {
  sessoesAbertas.value[sessao.label] = !(sessoesAbertas.value[sessao.label] ?? sessao.aberto)
}
</script>

<template>
  <aside
    id="app-sidebar"
    :class="[
      'shrink-0 bg-brand-primary border-r border-white/10 flex flex-col transition-all duration-200',
      // Abaixo de lg: expandida vira drawer sobre o conteúdo (sob o header z-40),
      // recolhida fica oculta sem empurrar o conteúdo; a partir de lg, o fluxo atual
      // (expandida w-52 / rail w-[46px] deslocando o conteúdo).
      sidebarOpen
        ? 'w-52 overflow-hidden fixed left-0 top-16 bottom-0 z-30 lg:static lg:z-auto lg:inset-auto'
        : 'w-[46px] overflow-visible hidden lg:flex'
    ]"
  >
    <div
      :class="[
        'flex flex-col gap-0.5 p-2 flex-1',
        sidebarOpen ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'
      ]"
    >
      <!-- Modo expandido -->
      <template v-if="sidebarOpen">
        <!-- Item raiz: sem cabeçalho de sessão -->
        <button
          type="button"
          :aria-label="itemRaiz.label"
          :aria-current="itemAtivo === itemRaiz.id ? 'page' : undefined"
          :class="[
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 w-full text-left transition-colors',
            itemAtivo === itemRaiz.id
              ? 'bg-white/10 text-lime-300'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          ]"
          @click="clicarItem(itemRaiz)"
        >
          <component :is="itemRaiz.icon" class="h-4 w-4 shrink-0 ds-icon-light" aria-hidden="true" />
          <span class="text-xs font-normal truncate">{{ itemRaiz.label }}</span>
        </button>

        <template v-for="sessao in sessoesVisiveis" :key="sessao.label">
          <button
            type="button"
            class="flex items-center justify-between w-full text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-3 pb-1 select-none hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
            :aria-expanded="sessao.aberto"
            :aria-label="`Sessão ${sessao.label}`"
            @click="alternarSessao(sessao)"
          >
            <span>{{ sessao.label }}</span>
            <ChevronDownIcon
              class="h-3 w-3 transition-transform duration-200"
              :class="sessao.aberto ? 'rotate-180' : 'rotate-0'"
              aria-hidden="true"
            />
          </button>

          <template v-if="sessao.aberto">
            <button
              v-for="item in sessao.items"
              :key="item.id"
              type="button"
              :aria-label="item.label"
              :aria-current="itemAtivo === item.id ? 'page' : undefined"
              :class="[
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 w-full text-left transition-colors',
                itemAtivo === item.id
                  ? 'bg-white/10 text-lime-300'
                  : 'text-slate-300 hover:bg-white/10 ds-item-hover'
              ]"
              :style="item.cor ? { '--item-cor': tinta(item.cor) } : undefined"
              @click="clicarItem(item)"
            >
              <component
                :is="item.icon"
                class="h-4 w-4 shrink-0 ds-icon-light"
                :style="item.cor ? { color: tinta(item.cor) } : undefined"
                aria-hidden="true"
              />
              <span class="text-xs font-normal truncate">{{ item.label }}</span>
            </button>
          </template>
        </template>
      </template>

      <!-- Modo rail: todos os ícones (o recolhimento de sessão vale só no modo expandido), com divisores -->
      <template v-else>
        <UiTooltip :content="itemRaiz.label" position="right" class="w-full">
          <button
            type="button"
            :aria-label="itemRaiz.label"
            :aria-current="itemAtivo === itemRaiz.id ? 'page' : undefined"
            :class="[
              'flex items-center justify-center rounded-lg py-2 w-full transition-colors',
              itemAtivo === itemRaiz.id
                ? 'bg-white/10 text-lime-300'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            ]"
            @click="clicarItem(itemRaiz)"
          >
            <component :is="itemRaiz.icon" class="h-4 w-4 shrink-0 ds-icon-light" aria-hidden="true" />
          </button>
        </UiTooltip>

        <template v-for="sessao in sessoesVisiveis" :key="sessao.label">
          <div class="h-px bg-white/15 mx-1 my-1.5" aria-hidden="true"></div>

          <UiTooltip
            v-for="item in sessao.items"
            :key="item.id"
            :content="item.label"
            position="right"
            class="w-full"
          >
            <button
              type="button"
              :aria-label="item.label"
              :aria-current="itemAtivo === item.id ? 'page' : undefined"
              :class="[
                'flex items-center justify-center rounded-lg py-2 w-full transition-colors',
                itemAtivo === item.id
                  ? 'bg-white/10 text-lime-300'
                  : 'text-slate-300 hover:bg-white/10 ds-item-hover'
              ]"
              :style="item.cor ? { '--item-cor': tinta(item.cor) } : undefined"
              @click="clicarItem(item)"
            >
              <component
                :is="item.icon"
                class="h-4 w-4 shrink-0 ds-icon-light"
                :style="item.cor ? { color: tinta(item.cor) } : undefined"
                aria-hidden="true"
              />
            </button>
          </UiTooltip>
        </template>
      </template>
    </div>
  </aside>
</template>
