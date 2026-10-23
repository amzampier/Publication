<script setup lang="ts">
import { AlertCircle, RotateCw } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
    retryLabel?: string
    retrying?: boolean
    compact?: boolean
  }>(),
  {
    title: 'Não foi possível carregar',
    message: 'Verifique a conexão e tente novamente.',
    retryLabel: 'Tentar novamente',
    retrying: false,
    compact: false
  }
)

const emit = defineEmits<{ (e: 'retry'): void }>()

const acionar = () => {
  if (props.retrying) return
  emit('retry')
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 px-5 text-center"
    :class="compact ? 'py-6' : 'py-12'"
    role="alert"
  >
    <AlertCircle class="mb-2 h-6 w-6 text-rose-700" aria-hidden="true" />
    <p class="text-sm font-medium text-rose-700">{{ title }}</p>
    <p class="mt-1 max-w-md text-xs text-slate-600">{{ message }}</p>
    <UiButton
      variant="outline"
      size="sm"
      class="mt-4"
      :loading="retrying"
      @click="acionar"
    >
      <RotateCw v-if="!retrying" class="h-3.5 w-3.5" aria-hidden="true" />
      {{ retryLabel }}
    </UiButton>
  </div>
</template>
