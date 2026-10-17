<script setup lang="ts">
import { Pencil } from '@lucide/vue'
import { computed } from 'vue'

interface Props {
  nome: string
  /** URL do arquivo da foto (avatar_url); no rascunho ainda não salvo pode ser uma dataURL; '' = sem foto (exibe iniciais) */
  preview?: string
}

const props = withDefaults(defineProps<Props>(), {
  preview: ''
})

const emit = defineEmits<{
  (e: 'alterar-foto'): void
}>()

const iniciais = computed(() => {
  const partes = (props.nome || '').trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : ''
  return (primeira + ultima).toUpperCase()
})
</script>

<template>
  <!-- group: quando há foto, o lápis fica oculto e aparece só no hover/foco -->
  <div class="group relative mx-auto w-fit">
    <div
      class="h-32 w-32 overflow-hidden rounded-full bg-slate-600 flex items-center justify-center shadow-sm"
    >
      <img
        v-if="preview"
        :src="preview"
        :alt="`Foto de perfil de ${nome}`"
        class="h-full w-full object-cover"
      />
      <span v-else class="text-3xl font-bold text-white select-none" aria-hidden="true">
        {{ iniciais }}
      </span>
    </div>
    <!-- Lápis flutuante: sempre visível sobre iniciais; com foto, some e reaparece no hover/foco -->
    <button
      type="button"
      aria-label="Alterar foto do perfil"
      class="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-primary text-white shadow-sm transition-all duration-150 hover:bg-brand-primary-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
      :class="preview ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' : ''"
      @click="emit('alterar-foto')"
    >
      <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  </div>
</template>
