<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

defineOptions({ inheritAttrs: false })

const Editor = defineAsyncComponent(() => import('./RichText.client.vue'))
</script>

<template>
  <Suspense>
    <Editor v-bind="$attrs" />
    <template #fallback>
      <div
        class="flex min-h-[120px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500"
        role="status"
      >
        Carregando editor…
      </div>
    </template>
  </Suspense>
</template>
