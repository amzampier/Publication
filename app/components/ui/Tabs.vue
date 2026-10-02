<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import type { Component } from 'vue'

export interface TabItem {
  id: string
  label: string
  icon?: Component
  /** Cor do ícone do item (Tailwind não resolve cor dinâmica em classe) */
  cor?: string
}

interface Props {
  modelValue: string
  items: TabItem[]
  ariaLabel?: string
  /** Prefixo dos ids de tab/painel — o consumidor repete o mesmo prefixo nos painéis */
  idPrefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Abas',
  idPrefix: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const geradoId = useId()
const prefixo = computed(() => props.idPrefix ?? geradoId)

const tablistRef = ref<HTMLElement | null>(null)

const ids = computed(() => props.items.map((item) => item.id))

const tabId = (id: string) => `${prefixo.value}-tab-${id}`
const panelId = (id: string) => `${prefixo.value}-panel-${id}`

defineExpose({ tabId, panelId })

const selecionar = (id: string) => {
  if (id === props.modelValue) return
  emit('update:modelValue', id)
  emit('change', id)
}

const focarTab = (id: string) => {
  nextTick(() => {
    const alvo = tablistRef.value?.querySelector<HTMLElement>(`#${CSS.escape(tabId(id))}`)
    alvo?.focus()
  })
}

const onKeydown = (event: KeyboardEvent) => {
  const atual = ids.value.indexOf(props.modelValue)
  if (atual === -1) return

  let proximo = -1
  switch (event.key) {
    case 'ArrowRight':
      proximo = (atual + 1) % ids.value.length
      break
    case 'ArrowLeft':
      proximo = (atual - 1 + ids.value.length) % ids.value.length
      break
    case 'Home':
      proximo = 0
      break
    case 'End':
      proximo = ids.value.length - 1
      break
    default:
      return
  }

  event.preventDefault()
  selecionar(ids.value[proximo])
  focarTab(ids.value[proximo])
}
</script>

<template>
  <div
    ref="tablistRef"
    role="tablist"
    :aria-label="ariaLabel"
    class="flex items-center gap-1 justify-start overflow-x-auto sm:justify-center sm:flex-wrap sm:overflow-visible"
    @keydown="onKeydown"
  >
    <button
      v-for="item in items"
      :key="item.id"
      :id="tabId(item.id)"
      type="button"
      role="tab"
      :aria-selected="modelValue === item.id"
      :aria-controls="panelId(item.id)"
      :tabindex="modelValue === item.id ? 0 : -1"
      :class="[
        'inline-flex items-center gap-2 shrink-0 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus',
        modelValue === item.id
          ? 'bg-lime-50 border-lime-300 text-lime-900 shadow-xs cursor-pointer hover:bg-lime-100'
          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
      ]"
      @click="selecionar(item.id)"
    >
      <component
        :is="item.icon"
        v-if="item.icon"
        class="h-4 w-4 shrink-0"
        :style="item.cor ? { color: item.cor } : undefined"
        aria-hidden="true"
      />
      <span>{{ item.label }}</span>
    </button>
  </div>
</template>
