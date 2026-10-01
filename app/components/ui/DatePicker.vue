<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Calendar as CalendarIcon, X, AlertCircle } from '@lucide/vue'
import Calendar from './Calendar.vue'
import Tooltip from './Tooltip.vue'

interface Props {
  modelValue?: Date | string | null
  label?: string
  placeholder?: string
  disabled?: boolean
  helperText?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: '',
  placeholder: 'DD/MM/AAAA',
  disabled: false,
  helperText: '',
  error: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', date: Date | null): void
  (e: 'change', date: Date | null): void
}>()

const isOpen = ref(false)
const inputStr = ref('')
const datePickerRef = ref<HTMLElement | null>(null)
const inputId = useId()

// Formatar Date para DD/MM/AAAA
const formatDate = (d: Date | null): string => {
  if (!d) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Converter string DD/MM/AAAA para Date
const parseDate = (str: string): Date | null => {
  const parts = str.split('/')
  if (parts.length !== 3) return null
  const [dayStr, monthStr, yearStr] = parts
  if (!dayStr || !monthStr || !yearStr) return null
  const day = parseInt(dayStr, 10)
  const month = parseInt(monthStr, 10) - 1
  const year = parseInt(yearStr, 10)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  const d = new Date(year, month, day)
  if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
    return d
  }
  return null
}

// Sincronizar input com modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      inputStr.value = ''
      return
    }
    const d = newVal instanceof Date ? newVal : new Date(newVal)
    if (!isNaN(d.getTime())) {
      inputStr.value = formatDate(d)
    }
  },
  { immediate: true }
)

// Máscara automática DD/MM/AAAA ao digitar
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let v = target.value.replace(/\D/g, '')
  if (v.length > 8) v = v.substring(0, 8)

  let formatted = ''
  if (v.length > 4) {
    formatted = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`
  } else if (v.length > 2) {
    formatted = `${v.substring(0, 2)}/${v.substring(2)}`
  } else {
    formatted = v
  }

  inputStr.value = formatted
  if (formatted.length === 10) {
    const parsed = parseDate(formatted)
    if (parsed) {
      emit('update:modelValue', parsed)
      emit('change', parsed)
    }
  } else if (formatted.length === 0) {
    emit('update:modelValue', null)
    emit('change', null)
  }
}

const handleCalendarSelect = (d: Date) => {
  const formatted = formatDate(d)
  inputStr.value = formatted
  emit('update:modelValue', d)
  emit('change', d)
  isOpen.value = false
}

const clearDate = (e: MouseEvent) => {
  e.stopPropagation()
  inputStr.value = ''
  emit('update:modelValue', null)
  emit('change', null)
}

// Fechar ao clicar fora
const handleClickOutside = (e: MouseEvent) => {
  if (datePickerRef.value && !datePickerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="datePickerRef"
    class="flex flex-col gap-1.5 w-full text-left relative select-none"
    @keydown.esc="isOpen = false"
  >
    <label
      v-if="label"
      :for="inputId"
      class="text-xs font-semibold text-slate-700 select-none flex items-center justify-between"
    >
      <span>{{ label }}</span>
    </label>

    <div
      :class="[
        'relative flex items-center bg-white border rounded-lg transition-all',
        error
          ? 'border-slate-200'
          : isOpen
            ? 'border-slate-300 border-b-brand-focus border-b-2 rounded-b-lg shadow-xs'
            : 'border-slate-200 hover:border-slate-300',
        disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''
      ]"
    >
      <div class="pl-3 pr-1 text-slate-400 flex items-center pointer-events-none">
        <CalendarIcon class="h-4 w-4" />
      </div>

      <input
        :id="inputId"
        type="text"
        :value="inputStr"
        :placeholder="placeholder"
        :disabled="disabled"
        maxlength="10"
        :class="[
          'w-full py-2 pl-2 bg-transparent text-slate-900 text-xs font-normal placeholder:text-slate-400 focus:outline-none tabular-nums',
          error ? 'pr-16' : 'pr-9'
        ]"
        @input="handleInput"
        @focus="isOpen = true"
      />

      <!-- Cantos inferiores em vermelho (clip-path igual ao Input/Select) -->
      <div
        v-if="error"
        class="absolute -inset-[1px] rounded-lg border-2 border-rose-700 pointer-events-none transition-all duration-150 ds-bottom-clip"
      />

      <div class="absolute right-3 flex items-center gap-1">
        <!-- Erro: apenas o ícone interno à direita, com tooltip exibindo a mensagem -->
        <Tooltip v-if="error" :content="error" position="top">
          <button
            type="button"
            aria-hidden="true"
            tabindex="-1"
            class="text-rose-700 hover:text-rose-800 flex items-center p-0.5 focus:outline-none"
          >
            <AlertCircle class="h-4 w-4" />
          </button>
        </Tooltip>
        <button
          v-if="inputStr && !disabled"
          type="button"
          class="text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none"
          @click="clearDate"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Popover com o Calendar -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-95"
    >
      <div v-if="isOpen" class="absolute top-full left-0 mt-1 z-50">
        <Calendar
          :model-value="modelValue"
          @select="handleCalendarSelect"
        />
      </div>
    </Transition>

    <p v-if="helperText" class="text-[11px] text-slate-500">
      {{ helperText }}
    </p>
  </div>
</template>
