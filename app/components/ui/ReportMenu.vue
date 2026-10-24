<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, type Component } from 'vue'
import { ChevronDown, NotebookText } from '@lucide/vue'

export interface ReportMenuItem {
  id: string
  label: string
  icon?: Component
  disabled?: boolean
  reason?: string
}

interface Props {
  items: ReportMenuItem[]
  label?: string
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Relatórios',
  loading: false,
  disabled: false
})

const emit = defineEmits<{ (e: 'select', id: string): void }>()

const aberto = ref(false)
const raiz = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)

const itens = computed(() => props.items.filter((item) => !item.disabled))
const primeiroBotao = () => raiz.value?.querySelector<HTMLButtonElement>('button')

const abrir = () => {
  if (props.disabled) return
  aberto.value = true
  void nextTick(() => menu.value?.querySelector<HTMLElement>('[role="menuitem"]')?.focus())
}

const fechar = (devolverFoco = true) => {
  aberto.value = false
  if (devolverFoco) primeiroBotao()?.focus()
}

const alternar = () => (aberto.value ? fechar() : abrir())

const selecionar = (id: string) => {
  emit('select', id)
  fechar()
}

const focarItem = (indice: number) => {
  const nodes = menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]')
  if (!nodes?.length) return
  nodes[(indice + nodes.length) % nodes.length]?.focus()
}

const indiceAtual = () => {
  const nodes = Array.from(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
  return nodes.indexOf(document.activeElement as HTMLElement)
}

const aoTecladoMenu = (evento: KeyboardEvent) => {
  if (evento.key === 'Escape') {
    evento.preventDefault()
    fechar()
    return
  }
  if (evento.key === 'ArrowDown') {
    evento.preventDefault()
    focarItem(indiceAtual() + 1)
  } else if (evento.key === 'ArrowUp') {
    evento.preventDefault()
    focarItem(indiceAtual() - 1)
  } else if (evento.key === 'Home') {
    evento.preventDefault()
    focarItem(0)
  } else if (evento.key === 'End') {
    evento.preventDefault()
    focarItem((menu.value?.querySelectorAll('[role="menuitem"]').length ?? 1) - 1)
  } else if (evento.key === 'Tab') {
    fechar()
  }
}

const aoClicarFora = (evento: MouseEvent) => {
  if (aberto.value && !raiz.value?.contains(evento.target as Node)) fechar(false)
}

onMounted(() => document.addEventListener('mousedown', aoClicarFora))
onUnmounted(() => document.removeEventListener('mousedown', aoClicarFora))
</script>

<template>
  <div ref="raiz" class="relative w-full sm:w-auto">
    <UiButton
      variant="outline"
      size="md"
      class="w-full sm:w-auto"
      :loading="loading"
      :disabled="disabled"
      aria-haspopup="menu"
      :aria-expanded="aberto"
      @click="alternar"
      @keydown.down.prevent="abrir"
      @keydown.enter.prevent="alternar"
      @keydown.space.prevent="alternar"
    >
      <template #leftIcon><NotebookText class="h-4 w-4" /></template>
      {{ label }}
      <ChevronDown
        class="h-3.5 w-3.5 transition-transform"
        :class="aberto ? 'rotate-180' : 'rotate-0'"
        aria-hidden="true"
      />
    </UiButton>

    <div
      v-if="aberto"
      ref="menu"
      role="menu"
      :aria-label="`Opções de ${label.toLowerCase()}`"
      class="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
      @keydown="aoTecladoMenu"
    >
      <button
        v-for="item in itens"
        :key="item.id"
        type="button"
        role="menuitem"
        tabindex="-1"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-light text-slate-700 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-focus"
        @click="selecionar(item.id)"
      >
        <component :is="item.icon" v-if="item.icon" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
