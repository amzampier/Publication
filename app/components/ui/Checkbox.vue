<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Check, Minus } from '@lucide/vue'

export type CheckboxSize = 'sm' | 'md' | 'lg'
export type CheckboxVariant = 'lime' | 'slate' | 'emerald' | 'indigo' | 'rose' | 'sky'
export type CheckboxPosition = 'start' | 'end'

interface Props {
  modelValue?: boolean | any[]
  value?: any
  label?: string
  description?: string
  error?: string
  disabled?: boolean
  indeterminate?: boolean
  size?: CheckboxSize
  variant?: CheckboxVariant
  checkboxPosition?: CheckboxPosition
  id?: string
  name?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  value: undefined,
  label: '',
  description: '',
  error: '',
  disabled: false,
  indeterminate: false,
  size: 'md',
  variant: 'lime',
  checkboxPosition: 'start',
  id: undefined,
  name: undefined,
  required: false
})

// Id estável (SSR/hidratação) — usado quando o consumidor não fornece `id`
const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean | any[]): void
  (e: 'change', value: boolean | any[]): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

// Sincronizar propriedade nativa indeterminate
const syncIndeterminate = () => {
  if (inputRef.value) {
    inputRef.value.indeterminate = Boolean(props.indeterminate)
  }
}

watch(() => props.indeterminate, syncIndeterminate)
onMounted(syncIndeterminate)

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return Boolean(props.modelValue)
})

const handleChange = (event: Event) => {
  if (props.disabled) return

  const target = event.target as HTMLInputElement
  const checked = target.checked

  if (Array.isArray(props.modelValue)) {
    const nextValue = [...props.modelValue]
    const idx = nextValue.indexOf(props.value)
    if (checked && idx === -1) {
      nextValue.push(props.value)
    } else if (!checked && idx !== -1) {
      nextValue.splice(idx, 1)
    }
    emit('update:modelValue', nextValue)
    emit('change', nextValue)
  } else {
    emit('update:modelValue', checked)
    emit('change', checked)
  }
}

// Configurações de tamanho da caixa
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return {
        box: 'h-3.5 w-3.5 rounded',
        icon: 'h-2.5 w-2.5 stroke-[2.5]',
        label: 'text-[11px]',
        desc: 'text-[10px]'
      }
    case 'lg':
      return {
        box: 'h-5 w-5 rounded-md',
        icon: 'h-3.5 w-3.5 stroke-[3]',
        label: 'text-sm font-semibold',
        desc: 'text-xs'
      }
    case 'md':
    default:
      return {
        box: 'h-4 w-4 rounded',
        icon: 'h-3 w-3 stroke-[2.5]',
        label: 'text-xs font-medium',
        desc: 'text-[11px]'
      }
  }
})

// Configurações de cores de variante
const variantClasses = computed(() => {
  if (props.disabled) {
    return 'border-slate-300 bg-slate-100 text-slate-400'
  }
  if (props.error) {
    return 'border-rose-300 text-rose-600 focus-visible:ring-rose-500/20'
  }

  switch (props.variant) {
    case 'slate':
      return isChecked.value || props.indeterminate
    ? 'border-brand-primary bg-brand-primary text-white focus-visible:ring-brand-primary/20'
    : 'border-slate-300 bg-white hover:border-slate-400 focus-visible:ring-brand-primary/20'
    case 'emerald':
      return isChecked.value || props.indeterminate
        ? 'border-emerald-600 bg-emerald-600 text-white focus-visible:ring-emerald-600/20'
        : 'border-slate-300 bg-white hover:border-emerald-400 focus-visible:ring-emerald-600/20'
    case 'indigo':
      return isChecked.value || props.indeterminate
        ? 'border-indigo-600 bg-indigo-600 text-white focus-visible:ring-indigo-600/20'
        : 'border-slate-300 bg-white hover:border-indigo-400 focus-visible:ring-indigo-600/20'
    case 'rose':
      return isChecked.value || props.indeterminate
        ? 'border-rose-600 bg-rose-600 text-white focus-visible:ring-rose-600/20'
        : 'border-slate-300 bg-white hover:border-rose-400 focus-visible:ring-rose-600/20'
    case 'sky':
      return isChecked.value || props.indeterminate
        ? 'border-sky-600 bg-sky-600 text-white focus-visible:ring-sky-600/20'
        : 'border-slate-300 bg-white hover:border-sky-400 focus-visible:ring-sky-600/20'
    case 'lime':
    default:
      return isChecked.value || props.indeterminate
      ? 'border-lime-500 bg-lime-500 text-white focus-visible:ring-brand-focus/20 shadow-xs'
      : 'border-slate-300 bg-white hover:border-brand-accent focus-visible:ring-brand-focus/20'
  }
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      :for="inputId"
      :class="[
        'group inline-flex items-start gap-2.5 select-none transition-colors',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        checkboxPosition === 'end' ? 'flex-row-reverse justify-between w-full' : ''
      ]"
    >
      <!-- Container do Input e da Caixa Visual -->
      <div class="relative flex items-center justify-center shrink-0 mt-0.5">
        <input
          :id="inputId"
          ref="inputRef"
          type="checkbox"
          :name="name"
          :checked="isChecked"
          :value="value"
          :disabled="disabled"
          :required="required"
          class="peer sr-only"
          @change="handleChange"
        />

        <!-- Caixa Customizada -->
        <div
          :class="[
            'border flex items-center justify-center transition-all duration-150',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1',
            sizeClasses.box,
            variantClasses
          ]"
        >
          <!-- Ícone Indeterminate (traço) -->
          <Minus
            v-if="indeterminate"
            :class="sizeClasses.icon"
          />
          <!-- Ícone Checked (check) -->
          <Check
            v-else-if="isChecked"
            :class="sizeClasses.icon"
          />
        </div>
      </div>

      <!-- Rótulo e Descrição -->
      <div v-if="label || description || $slots.default" class="flex flex-col">
        <span
          :class="[
            'leading-snug transition-colors',
            sizeClasses.label,
            disabled ? 'text-slate-400' : 'text-slate-800 group-hover:text-slate-900',
            error ? 'text-rose-700' : ''
          ]"
        >
          <slot>{{ label }}</slot>
        </span>

        <p
          v-if="description"
          :class="['text-slate-500 leading-tight mt-0.5', sizeClasses.desc]"
        >
          {{ description }}
        </p>
      </div>
    </label>
  </div>
</template>
