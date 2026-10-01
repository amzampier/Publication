<script setup lang="ts">
import { computed } from 'vue'
import Checkbox, { type CheckboxSize, type CheckboxVariant } from './Checkbox.vue'

export type BadgeCheckboxVariant =
  | 'lime'
  | 'emerald'
  | 'indigo'
  | 'rose'
  | 'sky'
  | 'slate'
  | 'purple'
  | 'default'

interface Props {
  modelValue?: boolean | any[]
  value?: any
  label: string
  badge: string
  badgeVariant?: BadgeCheckboxVariant
  size?: CheckboxSize
  variant?: CheckboxVariant
  disabled?: boolean
  description?: string
  error?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  value: undefined,
  badgeVariant: 'default',
  size: 'md',
  variant: 'lime',
  disabled: false,
  description: '',
  error: '',
  id: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean | any[]): void
  (e: 'change', value: boolean | any[]): void
}>()

const badgeStyle = computed(() => {
  switch (props.badgeVariant) {
    case 'lime':
      return 'bg-lime-50 border-lime-200 text-lime-800'
    case 'emerald':
      return 'bg-emerald-50 border-emerald-200 text-emerald-800'
    case 'indigo':
      return 'bg-indigo-50 border-indigo-200 text-indigo-800'
    case 'rose':
      return 'bg-rose-50 border-rose-200 text-rose-700'
    case 'sky':
      return 'bg-sky-50 border-sky-200 text-sky-800'
    case 'slate':
      return 'bg-brand-primary border-brand-primary text-white'
    case 'purple':
      return 'bg-purple-50 border-purple-200 text-purple-800'
    case 'default':
    default:
      return 'bg-slate-100 border-slate-200 text-slate-700'
  }
})
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <Checkbox
      :id="id"
      :model-value="modelValue"
      :value="value"
      :size="size"
      :variant="variant"
      :disabled="disabled"
      :description="description"
      :error="error"
      @update:model-value="emit('update:modelValue', $event)"
      @change="emit('change', $event)"
    >
      <div class="inline-flex items-center gap-2">
        <span>{{ label }}</span>
        <span
          :class="[
            'border font-bold uppercase tracking-wider rounded-md select-none transition-colors',
            size === 'sm' ? 'px-1.5 py-0.2 text-[9px]' : size === 'lg' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[10px]',
            badgeStyle
          ]"
        >
          {{ badge }}
        </span>
      </div>
    </Checkbox>
  </div>
</template>
