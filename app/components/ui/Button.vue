<script setup lang="ts">
import { computed } from 'vue'

export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'accent'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'outline':
      return 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 active:bg-slate-100'
    case 'danger':
      return 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 active:bg-rose-200'
    case 'accent':
      return 'bg-lime-50 hover:bg-lime-100 border border-lime-300 text-lime-900 active:bg-lime-200'
    case 'primary':
    default:
      return 'bg-gradient-to-r from-brand-primary to-brand-structure hover:brightness-110 active:brightness-95 text-white shadow-xs'
  }
})

const sizeClasses = computed(() => {
  // Altura fixa por size (docs/01 §5.1): borda contida no box — outline/danger/accent
  // medem o mesmo que primary em cada size (M-06 da QA-ux).
  switch (props.size) {
    case 'sm':
      return 'h-7 px-2.5 text-[11px] gap-1.5'
    case 'lg':
      return 'h-10 px-5 text-sm gap-2.5'
    case 'md':
    default:
      return 'h-8 px-3.5 text-xs gap-2'
  }
})

const handleClick = (e: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all select-none',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses,
      sizeClasses
    ]"
    @click="handleClick"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot name="leftIcon" />
    <slot />
    <slot name="rightIcon" />
  </button>
</template>
