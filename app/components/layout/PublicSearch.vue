<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Search, X } from '@lucide/vue'

const busca = ref('')
const painelAberto = ref(false)
const painelRef = ref<HTMLElement | null>(null)
const gatilhoRef = ref<HTMLButtonElement | null>(null)

const focarCampo = async () => {
  await nextTick()
  painelRef.value?.querySelector<HTMLInputElement>('input')?.focus()
}

const abrirPainel = async () => {
  painelAberto.value = true
  await focarCampo()
}

const fecharPainel = () => {
  painelAberto.value = false
  gatilhoRef.value?.focus()
}

const limpar = () => {
  busca.value = ''
}

const aoTecladoPainel = (evento: KeyboardEvent) => {
  if (evento.key === 'Escape') {
    evento.preventDefault()
    fecharPainel()
  }
}
</script>

<template>
  <div class="flex items-center">
    <!-- Desktop: campo sempre visível -->
    <form
      role="search"
      aria-label="Pesquisa global da Área Pública"
      class="hidden w-64 xl:w-80 lg:block"
      @submit.prevent
    >
      <UiInput
        v-model="busca"
        type="search"
        aria-label="Pesquisa global da Área Pública"
        placeholder="Pesquisar releases, manuais e chamadas…"
        :left-icon="Search"
        :right-icon="busca ? X : null"
        right-icon-label="Limpar pesquisa"
        @right-icon-click="limpar"
      />
    </form>

    <!-- Mobile: ícone abre painel sobreposto -->
    <button
      ref="gatilhoRef"
      type="button"
      class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 lg:hidden"
      aria-label="Abrir pesquisa global"
      aria-controls="publico-pesquisa-painel"
      :aria-expanded="painelAberto"
      @click="abrirPainel"
    >
      <Search class="h-4 w-4" aria-hidden="true" />
    </button>

    <div
      v-if="painelAberto"
      class="fixed inset-0 top-16 z-40 bg-slate-900/20 lg:hidden"
      aria-hidden="true"
      @click="fecharPainel"
    />
    <div
      v-if="painelAberto"
      id="publico-pesquisa-painel"
      ref="painelRef"
      role="dialog"
      aria-modal="true"
      aria-label="Pesquisa global da Área Pública"
      class="fixed left-0 right-0 top-16 z-50 border-b border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:hidden"
      @keydown="aoTecladoPainel"
    >
      <form role="search" aria-label="Pesquisa global da Área Pública" @submit.prevent>
        <div class="flex items-center gap-2">
          <UiInput
            v-model="busca"
            type="search"
            aria-label="Pesquisa global da Área Pública"
            placeholder="Pesquisar releases, manuais e chamadas…"
            :left-icon="Search"
            :right-icon="busca ? X : null"
            right-icon-label="Limpar pesquisa"
            class="flex-1"
            @right-icon-click="limpar"
          />
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            aria-label="Fechar pesquisa"
            @click="fecharPainel"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
