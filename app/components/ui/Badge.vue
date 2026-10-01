<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  Search,
  AlertTriangle
} from '@lucide/vue'

export type BadgeVariant =
  | 'done'
  | 'reconciled'
  | 'pending'
  | 'inReview'
  | 'blocked'
  | 'neutral'

interface Props {
  variant?: BadgeVariant
  pulsing?: boolean
  showIcon?: boolean
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  pulsing: false,
  showIcon: true,
  size: 'md'
})

const variantConfig = computed(() => {
  switch (props.variant) {
    case 'done':
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
        label: 'Concluído'
      }
    case 'reconciled':
      return {
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
        dot: 'bg-indigo-500',
        icon: ShieldCheck,
        label: 'Reconciliado'
      }
    case 'pending':
      return {
        bg: 'bg-orange-50 border-orange-200 text-orange-800',
        dot: 'bg-orange-500',
        icon: Clock,
        label: 'Pendente'
      }
    case 'inReview':
      return {
        bg: 'bg-blue-50 border-blue-200 text-blue-800',
        dot: 'bg-blue-500',
        icon: Search,
        label: 'Em Análise'
      }
    case 'blocked':
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        dot: 'bg-rose-500',
        icon: AlertTriangle,
        label: 'Bloqueado'
      }
    case 'neutral':
    default:
      return {
        bg: 'bg-slate-100 border-slate-200 text-slate-700',
        dot: 'bg-slate-500',
        icon: null,
        label: 'Neutro'
      }
  }
})

const isPulsing = computed(() => {
  return props.pulsing || props.variant === 'blocked'
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 border font-semibold select-none rounded-md transition-colors',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px] leading-tight',
      variantConfig.bg
    ]"
  >
    <span v-if="isPulsing" class="relative flex h-2 w-2 mr-0.5">
      <span
        class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        :class="variantConfig.dot"
      ></span>
      <span
        class="relative inline-flex rounded-full h-2 w-2"
        :class="variantConfig.dot"
      ></span>
    </span>

    <component
      :is="variantConfig.icon"
      v-else-if="showIcon && variantConfig.icon"
      class="h-3.5 w-3.5 shrink-0 stroke-[2.25]"
    />

    <slot>{{ variantConfig.label }}</slot>
  </span>
</template>
