<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@lucide/vue'

export type ChipVariant = 'lime' | 'emerald' | 'indigo' | 'rose' | 'sky' | 'slate'
export type ChipSize = 'sm' | 'md' | 'lg'

interface Props {
  modelValue?: boolean
  label: string
  count?: number | string
  variant?: ChipVariant
  size?: ChipSize
  disabled?: boolean
  icon?: any
  /** Exibe o ícone ✓ quando ativo (false = só o rótulo na pill) */
  showCheck?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  count: undefined,
  variant: 'lime',
  size: 'md',
  disabled: false,
  icon: undefined,
  showCheck: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const toggle = () => {
  if (props.disabled) return
  const next = !props.modelValue
  emit('update:modelValue', next)
  emit('change', next)
}

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return {
        chip: 'px-2 py-0.5 text-[11px] gap-1.5 rounded',
        icon: 'h-3 w-3 stroke-[2.5]',
        count: 'text-[10px] px-1 py-0.2'
      }
    case 'lg':
      return {
        chip: 'px-3.5 py-1.5 text-xs gap-2 rounded-lg font-semibold',
        icon: 'h-4 w-4 stroke-[3]',
        count: 'text-[11px] px-1.5 py-0.5'
      }
    case 'md':
    default:
      return {
        chip: 'px-2.5 py-1 text-xs gap-1.5 rounded-md font-medium',
        icon: 'h-3.5 w-3.5 stroke-[2.5]',
        count: 'text-[10px] px-1.5 py-0.2'
      }
  }
})

const variantClasses = computed(() => {
  if (props.disabled) {
    return 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
  }

  if (!props.modelValue) {
    return 'bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 cursor-pointer shadow-2xs'
  }

  switch (props.variant) {
    case 'slate':
      return 'bg-brand-primary border-brand-primary text-white shadow-xs cursor-pointer'
    case 'emerald':
      return 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs cursor-pointer'
    case 'indigo':
      return 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-xs cursor-pointer'
    case 'rose':
      return 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs cursor-pointer'
    case 'sky':
      return 'bg-sky-50 border-sky-300 text-sky-800 shadow-xs cursor-pointer'
    case 'lime':
    default:
      return 'bg-lime-50 border-lime-300 text-lime-900 shadow-xs cursor-pointer'
  }
})

const countClasses = computed(() => {
  if (!props.modelValue) {
    return 'bg-slate-100 text-slate-600'
  }
  switch (props.variant) {
    case 'slate':
      return 'bg-brand-primary-raised text-brand-accent'
    case 'emerald':
      return 'bg-emerald-100/90 text-emerald-800'
    case 'indigo':
      return 'bg-indigo-100/90 text-indigo-800'
    case 'rose':
      return 'bg-rose-100/90 text-rose-800'
    case 'sky':
      return 'bg-sky-100/90 text-sky-800'
    case 'lime':
    default:
      return 'bg-lime-100/90 text-lime-900'
  }
})
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'inline-flex items-center border select-none transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-focus/30',
      sizeClasses.chip,
      variantClasses
    ]"
    @click="toggle"
  >
    <!-- Ícone de Check animado quando selecionado OU ícone temático customizado -->
    <span
      v-if="modelValue && showCheck"
      class="flex items-center justify-center transition-transform scale-100 duration-150"
    >
      <Check :class="sizeClasses.icon" />
    </span>
    <component
      :is="icon"
      v-else-if="icon"
      :class="[sizeClasses.icon, 'text-slate-400']"
    />

    <!-- Rótulo -->
    <span>{{ label }}</span>

    <!-- Contador Opcional (ex: Receitas (14)) -->
    <span
      v-if="count !== undefined"
      :class="['rounded font-mono font-bold leading-none tabular-nums transition-colors', sizeClasses.count, countClasses]"
    >
      {{ count }}
    </span>
  </button>
</template>
