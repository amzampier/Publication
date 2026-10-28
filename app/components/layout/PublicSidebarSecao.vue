<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronDown, ChevronRight } from '@lucide/vue'

withDefaults(
  defineProps<{
    id: string
    titulo: string
    icone: Component
    cor: string
    hoverCor?: string
    quantidade: number
    aberta?: boolean
  }>(),
  { hoverCor: '', aberta: true }
)

defineEmits<{ (e: 'toggle'): void }>()
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between px-1">
      <button
        type="button"
        class="flex min-w-0 items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-slate-200"
        :class="hoverCor"
        :aria-expanded="aberta"
        :aria-controls="`publico-secao-${id}`"
        @click="$emit('toggle')"
      >
        <component :is="icone" class="h-3.5 w-3.5 shrink-0" :class="cor" aria-hidden="true" />
        <span class="truncate">{{ titulo }}</span>
        <ChevronDown v-if="aberta" class="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <ChevronRight v-else class="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
      <span class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        {{ quantidade }}
      </span>
    </div>

    <div v-if="aberta" :id="`publico-secao-${id}`">
      <slot />
    </div>
  </div>
</template>
