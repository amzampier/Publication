<script setup lang="ts">
import { computed } from 'vue'
import Checkbox, { type CheckboxVariant } from './Checkbox.vue'

interface Props {
  modelValue?: boolean | any[]
  value?: any
  title: string
  description?: string
  badge?: string
  badgeVariant?: 'lime' | 'emerald' | 'indigo' | 'slate' | 'neutral'
  icon?: any
  variant?: CheckboxVariant
  checkboxPosition?: 'start' | 'end'
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  value: undefined,
  description: '',
  badge: '',
  badgeVariant: 'lime',
  icon: undefined,
  variant: 'lime',
  checkboxPosition: 'end',
  disabled: false,
  id: undefined
})

// Ids estáveis para aria-labelledby (título/descrição do cartão)
const cardId = useId()
const titleId = `${cardId}-title`
const descId = `${cardId}-desc`

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean | any[]): void
  (e: 'change', value: boolean | any[]): void
}>()

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return Boolean(props.modelValue)
})

const toggleCard = () => {
  if (props.disabled) return

  if (Array.isArray(props.modelValue)) {
    const next = [...props.modelValue]
    const idx = next.indexOf(props.value)
    if (idx === -1) {
      next.push(props.value)
    } else {
      next.splice(idx, 1)
    }
    emit('update:modelValue', next)
    emit('change', next)
  } else {
    const next = !props.modelValue
    emit('update:modelValue', next)
    emit('change', next)
  }
}

const cardStyle = computed(() => {
  if (props.disabled) {
    return 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
  }

  if (isChecked.value) {
    switch (props.variant) {
      case 'indigo':
        return 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/30 shadow-xs cursor-pointer'
      case 'emerald':
        return 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 shadow-xs cursor-pointer'
      case 'slate':
        return 'border-slate-800 bg-slate-100 ring-1 ring-slate-800/30 shadow-xs cursor-pointer'
      case 'lime':
      default:
        return 'border-brand-accent bg-lime-50/30 ring-1 ring-brand-accent/40 shadow-xs cursor-pointer'
    }
  }

  return 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs cursor-pointer'
})

const badgeStyle = computed(() => {
  switch (props.badgeVariant) {
    case 'emerald':
      return 'bg-emerald-50 border-emerald-200 text-emerald-800'
    case 'indigo':
      return 'bg-indigo-50 border-indigo-200 text-indigo-800'
    case 'slate':
      return 'bg-brand-primary border-brand-primary text-white'
    case 'neutral':
      return 'bg-slate-100 border-slate-200 text-slate-700'
    case 'lime':
    default:
      return 'bg-lime-100 border-lime-200 text-lime-900'
  }
})
</script>

<template>
  <div
    :class="[
      'rounded-xl border p-4 transition-all duration-150 relative select-none flex flex-col justify-between',
      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-focus/60',
      cardStyle
    ]"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descId : undefined"
    :aria-disabled="disabled"
    @click="toggleCard"
    @keydown.enter.prevent="toggleCard"
  >
    <!-- Topo: Ícone Setorial, Badge e Checkbox -->
    <div class="flex items-start justify-between gap-3 mb-2.5">
      <div class="flex items-center gap-2.5">
        <div
          v-if="icon"
          :class="[
            'p-2 rounded-lg transition-colors shrink-0',
            isChecked ? 'bg-lime-500/15 text-lime-700' : 'bg-slate-100 text-slate-500'
          ]"
        >
          <component :is="icon" class="h-4 w-4" />
        </div>

        <div
          v-if="checkboxPosition === 'start'"
          class="shrink-0"
          @click.stop
        >
          <Checkbox
            :id="id"
            :model-value="modelValue"
            :value="value"
            :variant="variant"
            :disabled="disabled"
            @update:model-value="emit('update:modelValue', $event)"
            @change="emit('change', $event)"
          />
        </div>

        <span
          v-if="badge"
          :class="['px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider', badgeStyle]"
        >
          {{ badge }}
        </span>
      </div>

      <!-- Checkbox no Topo Direito (padrão) -->
      <div v-if="checkboxPosition === 'end'" class="shrink-0 ml-auto" @click.stop>
        <Checkbox
          :id="id"
          :model-value="modelValue"
          :value="value"
          :variant="variant"
          :disabled="disabled"
          @update:model-value="emit('update:modelValue', $event)"
          @change="emit('change', $event)"
        />
      </div>
    </div>

    <!-- Conteúdo Central: Título e Descrição -->
    <div class="flex flex-col gap-1">
      <h4 :id="titleId" class="text-xs font-bold text-slate-900 leading-snug">
        {{ title }}
      </h4>
      <p v-if="description" :id="descId" class="text-[11px] text-slate-500 leading-relaxed">
        {{ description }}
      </p>
      <slot />
    </div>
  </div>
</template>
