<script setup lang="ts">
import { Building2 } from '@lucide/vue'

interface Props {
  subtitulo?: string
  logo?: string
}

withDefaults(defineProps<Props>(), {
  subtitulo: '',
  logo: ''
})
</script>

<template>
  <header class="flex flex-col items-center text-center">
    <!-- Identidade: logomarca de Configurações > Logomarcas ou a marca padrão do sistema. -->
    <img
      v-if="logo"
      :src="logo"
      alt="Logomarca do sistema"
      class="h-10 max-w-full object-contain"
    >
    <div
      v-else
      class="flex items-center gap-2"
    >
      <span class="p-1.5 rounded-md bg-brand-primary/10 text-brand-primary shrink-0">
        <Building2 class="h-4 w-4" aria-hidden="true" />
      </span>
      <span class="text-sm font-bold tracking-tight text-slate-900">Publications</span>
    </div>

    <p
      v-if="subtitulo"
      class="mt-1 text-sm italic text-slate-500"
    >
      {{ subtitulo }}
    </p>
  </header>
</template>
