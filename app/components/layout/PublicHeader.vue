<script setup lang="ts">
import { Building2, LogIn, Menu } from '@lucide/vue'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import PublicSearch from './PublicSearch.vue'
import PublicThemeToggle from './PublicThemeToggle.vue'

withDefaults(
  defineProps<{
    sidebarAberta?: boolean
    demo?: boolean
  }>(),
  { sidebarAberta: false, demo: false }
)

defineEmits<{ (e: 'toggle-sidebar'): void }>()

const { preview: logomarca } = useLogomarcaLogin()
</script>

<template>
  <header
    :class="[
      'flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 text-slate-900 sm:px-6 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
      demo ? 'relative' : 'sticky top-0 z-40'
    ]"
  >
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
        :aria-label="sidebarAberta ? 'Fechar menu da Área Pública' : 'Abrir menu da Área Pública'"
        :aria-expanded="sidebarAberta"
        aria-controls="public-sidebar"
        @click="$emit('toggle-sidebar')"
      >
        <Menu class="h-5 w-5" aria-hidden="true" />
      </button>

      <NuxtLink
        to="/"
        class="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50"
        aria-label="Ir para o início da Área Pública — Dicas Teorema"
      >
        <img
          v-if="logomarca"
          :src="logomarca"
          alt="Logomarca Teorema"
          class="h-8 max-w-[160px] shrink-0 object-contain"
        >
        <span
          v-else
          class="shrink-0 rounded-md bg-brand-primary/10 p-1.5 text-brand-primary dark:bg-white/10 dark:text-slate-100"
        >
          <Building2 class="h-4 w-4" aria-hidden="true" />
        </span>
        <span class="hidden truncate text-sm font-bold tracking-tight whitespace-nowrap sm:inline sm:text-base">
          Dicas Teorema
        </span>
      </NuxtLink>
    </div>

    <div class="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
      <PublicSearch />
      <PublicThemeToggle />
      <NuxtLink
        to="/admin/login"
        class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white sm:px-3"
        aria-label="Entrar na Área Administrativa"
      >
        <LogIn class="h-4 w-4" aria-hidden="true" />
        <span class="hidden sm:inline">Entrar</span>
      </NuxtLink>
    </div>
  </header>
</template>
