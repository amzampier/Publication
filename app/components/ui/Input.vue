<script setup lang="ts">
import { ref } from 'vue'
import { AlertCircle } from '@lucide/vue'
import Tooltip from './Tooltip.vue'

interface Props {
  modelValue?: string | number
  label?: string
  labelClass?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  helperText?: string
  leftIcon?: any
  rightIcon?: any
  mono?: boolean
  inputClass?: string
  forceFocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  labelClass: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  error: '',
  helperText: '',
  leftIcon: null,
  rightIcon: null,
  mono: false,
  inputClass: '',
  forceFocus: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'rightIconClick'): void
}>()

const isFocused = ref(false)
const inputId = useId()

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full text-left">
    <!-- Label do Campo -->
    <label
      v-if="label"
      :for="inputId"
      :class="[
        'text-xs font-bold select-none flex items-center justify-between',
        error ? 'text-rose-700' : 'text-slate-700',
        labelClass
      ]"
    >
      <span>{{ label }}</span>
      <slot name="labelRight" />
    </label>

    <!-- Container do Input -->
    <div
      :class="[
        'relative flex items-center bg-white border border-slate-200 rounded-lg transition-all h-[34px]',
        disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-slate-300'
      ]"
    >
      <!-- Destaque de Foco: Borda inferior e rigorosamente apenas os dois cantos inferiores arredondados em brand-focus (foco canônico) -->
      <span
        v-if="(isFocused || forceFocus) && !error"
        class="absolute -inset-[1px] rounded-lg border-2 border-brand-focus pointer-events-none transition-all duration-150 ds-bottom-clip"
      ></span>

      <!-- Destaque de Erro: Borda inferior e rigorosamente apenas os dois cantos inferiores arredondados em vermelho -->
      <span
        v-if="error"
        class="absolute -inset-[1px] rounded-lg border-2 border-rose-700 pointer-events-none transition-all duration-150 ds-bottom-clip"
      ></span>

      <!-- Ícone Esquerdo -->
      <div
        v-if="leftIcon || $slots.leftIcon"
        class="pl-3.5 pr-1.5 text-slate-400 flex items-center pointer-events-none shrink-0"
      >
        <component :is="leftIcon" v-if="leftIcon" class="h-4 w-4" />
        <slot name="leftIcon" />
      </div>

      <!-- Input de Texto (Sem outline preto do navegador) -->
      <input
        :id="inputId"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'w-full h-full bg-transparent text-slate-900 text-xs placeholder:text-slate-400',
          'border-none outline-none focus:outline-none ring-0 focus:ring-0 disabled:cursor-not-allowed',
          mono ? 'font-mono tabular-nums font-medium tracking-tight' : 'font-normal',
          (leftIcon || $slots.leftIcon) ? 'pl-1.5' : 'pl-3.5',
          (rightIcon || $slots.rightIcon || error) ? 'pr-9' : 'pr-3.5',
          inputClass
        ]"
        style="outline: none !important; box-shadow: none !important;"
        @input="handleInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <!-- Erro: apenas o ícone interno à direita, com tooltip exibindo a mensagem -->
      <div v-if="error" class="absolute right-3 flex items-center">
        <Tooltip :content="error" position="top">
          <button
            type="button"
            aria-hidden="true"
            tabindex="-1"
            class="text-rose-700 hover:text-rose-800 border-none outline-none focus:outline-none ring-0 focus:ring-0 flex items-center p-0.5"
            style="outline: none !important; box-shadow: none !important;"
          >
            <AlertCircle class="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      <!-- Ícone Direito Interativo ou Informativo -->
      <div
        v-else-if="rightIcon || $slots.rightIcon"
        class="absolute right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
        @click="emit('rightIconClick')"
      >
        <component :is="rightIcon" v-if="rightIcon" class="h-4 w-4" />
        <slot name="rightIcon" />
      </div>
    </div>

    <!-- Helper Text -->
    <p v-if="helperText" class="text-[11px] text-slate-500">
      {{ helperText }}
    </p>
  </div>
</template>
