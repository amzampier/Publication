<script setup lang="ts">
// Leitor do texto rico — renderiza o HTML já sanitizado pelo servidor com os
// estilos de `.ds-rich-text`. Sem HTML (registro legado ou importado), exibe o
// texto puro preservando as quebras de linha.
interface Props {
  html?: string
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  html: '',
  text: ''
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div
    v-if="props.html"
    class="ds-rich-text text-xs leading-relaxed text-slate-800"
    v-html="props.html"
  />
  <p v-else class="whitespace-pre-line text-xs leading-relaxed text-slate-800">
    {{ props.text || '—' }}
  </p>
</template>
