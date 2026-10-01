<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown as ChevronDownIcon } from '@lucide/vue'
import type { SidebarSession } from '../../config/navigation'
import { itemRaiz, sessoes as sessoesDefinidas } from '../../config/navigation'

defineProps<{ sidebarOpen: boolean }>()

const sessoes = ref<SidebarSession[]>(
  sessoesDefinidas.map((sessao) => ({ ...sessao, items: [...sessao.items] }))
)

const itemAtivo = ref<string>(itemRaiz.id)

const sessoesVisiveis = computed(() => sessoes.value.filter((sessao) => sessao.items.length > 0))

const alternarSessao = (sessao: SidebarSession) => {
  sessao.aberto = !sessao.aberto
}
</script>

<template>
  <aside
    id="app-sidebar"
    :class="[
      'shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-200',
      // No rail o overflow fica visível para o UiTooltip não ser cortado
      sidebarOpen ? 'w-52 overflow-hidden' : 'w-[46px] overflow-visible'
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
              ? 'bg-brand-structure/10 text-lime-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          ]"
          @click="itemAtivo = itemRaiz.id"
        >
          <component :is="itemRaiz.icon" class="h-4 w-4 shrink-0 ds-icon-light" aria-hidden="true" />
          <span class="text-xs font-normal truncate">{{ itemRaiz.label }}</span>
        </button>

        <template v-for="sessao in sessoesVisiveis" :key="sessao.label">
          <button
            type="button"
            class="flex items-center justify-between w-full text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-3 pb-1 select-none hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:text-slate-600"
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
                  ? 'bg-brand-structure/10 text-lime-700'
                  : 'text-slate-600 hover:bg-slate-100 ds-item-hover'
              ]"
              :style="item.cor ? { '--item-cor': item.cor } : undefined"
              @click="itemAtivo = item.id"
            >
              <component
                :is="item.icon"
                class="h-4 w-4 shrink-0 ds-icon-light"
                :style="item.cor ? { color: item.cor } : undefined"
                aria-hidden="true"
              />
              <span class="text-xs font-normal truncate">{{ item.label }}</span>
            </button>
          </template>
        </template>
      </template>

      <!-- Modo rail: somente ícones das sessões abertas, com divisores -->
      <template v-else>
        <UiTooltip :content="itemRaiz.label" position="right" class="w-full">
          <button
            type="button"
            :aria-label="itemRaiz.label"
            :aria-current="itemAtivo === itemRaiz.id ? 'page' : undefined"
            :class="[
              'flex items-center justify-center rounded-lg py-2 w-full transition-colors',
              itemAtivo === itemRaiz.id
                ? 'bg-brand-structure/10 text-lime-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            ]"
            @click="itemAtivo = itemRaiz.id"
          >
            <component :is="itemRaiz.icon" class="h-4 w-4 shrink-0 ds-icon-light" aria-hidden="true" />
          </button>
        </UiTooltip>

        <template v-for="sessao in sessoesVisiveis" :key="sessao.label">
          <div v-if="sessao.aberto" class="h-px bg-slate-200 mx-1 my-1.5" aria-hidden="true"></div>

          <template v-if="sessao.aberto">
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
                    ? 'bg-brand-structure/10 text-lime-700'
                    : 'text-slate-600 hover:bg-slate-100 ds-item-hover'
                ]"
                :style="item.cor ? { '--item-cor': item.cor } : undefined"
                @click="itemAtivo = item.id"
              >
                <component
                  :is="item.icon"
                  class="h-4 w-4 shrink-0 ds-icon-light"
                  :style="item.cor ? { color: item.cor } : undefined"
                  aria-hidden="true"
                />
              </button>
            </UiTooltip>
          </template>
        </template>
      </template>
    </div>
  </aside>
</template>
