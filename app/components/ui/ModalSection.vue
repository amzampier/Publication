<script setup lang="ts">
interface Props {
  icon?: any
  title: string
}

withDefaults(defineProps<Props>(), {
  icon: null
})
</script>

<template>
  <section class="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
    <div class="flex items-center gap-2.5">
      <div
        v-if="icon"
        class="p-1.5 rounded-lg bg-white text-lime-700 shrink-0"
        aria-hidden="true"
      >
        <component :is="icon" class="h-3.5 w-3.5" />
      </div>
      <h3 class="text-xs font-light text-slate-500 leading-tight">{{ title }}</h3>
    </div>

    <div class="h-px bg-slate-200 mt-0.5 mb-2" aria-hidden="true" />

    <div class="grid gap-4 [&>*]:min-w-0">
      <slot />
    </div>
  </section>
</template>
