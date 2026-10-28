<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { useTemaPublico } from '../../composables/useTemaPublico'

const { escuro, rotulo, alternar } = useTemaPublico()
</script>

<template>
  <button
    type="button"
    class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    :aria-label="rotulo"
    :aria-pressed="escuro"
    :title="rotulo"
    @click="alternar"
  >
    <Sun v-if="escuro" class="h-4 w-4" aria-hidden="true" />
    <Moon v-else class="h-4 w-4" aria-hidden="true" />
  </button>
</template>
