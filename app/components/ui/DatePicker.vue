<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
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
// Id estável da mensagem de erro — referenciada por aria-describedby no input
// e renderizada como região viva (role="alert") abaixo do campo.
const erroId = `${inputId}-erro`

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

const onEsc = (e: KeyboardEvent) => {
  if (isOpen.value) {
    e.stopPropagation()
    isOpen.value = false
  }
}

// Fechar ao clicar fora
const handleClickOutside = (e: MouseEvent) => {
  if (datePickerRef.value && !datePickerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

// Auto-inversão do popover (espelha o UiSelect): abre para cima quando não há
// espaço suficiente abaixo e há mais espaço acima do que abaixo.
const abreParaCima = ref(false)
const alinhaDireita = ref(false)
const popoverRef = ref<HTMLElement | null>(null)

function limitesDeRolagem(el: HTMLElement) {
  let superior = 0
  let inferior = window.innerHeight
  let atual: HTMLElement | null = el
  while (atual && atual !== document.documentElement) {
    const estilo = getComputedStyle(atual)
    if (estilo.overflowY !== 'visible' || estilo.overflowX !== 'visible') {
      const rect = atual.getBoundingClientRect()
      superior = Math.max(superior, rect.top)
      inferior = Math.min(inferior, rect.bottom)
    }
    atual = atual.parentElement
  }
  return { superior, inferior }
}

function atualizarPosicao() {
  const campo = datePickerRef.value
  const popover = popoverRef.value
  if (!campo || !popover) return
  const rect = campo.getBoundingClientRect()
  const alturaPopover = popover.offsetHeight
  const larguraPopover = popover.offsetWidth
  const { superior, inferior } = limitesDeRolagem(campo)
  const espacoAbaixo = inferior - rect.bottom
  const espacoAcima = rect.top - superior
  abreParaCima.value = espacoAbaixo < alturaPopover && espacoAcima > espacoAbaixo
  alinhaDireita.value = rect.left + larguraPopover > window.innerWidth - 8
}

function aoRolar() {
  if (isOpen.value) atualizarPosicao()
}

watch(isOpen, (aberto) => {
  if (aberto) {
    nextTick(() => {
      atualizarPosicao()
      window.addEventListener('scroll', aoRolar, true)
      window.addEventListener('resize', aoRolar)
    })
  } else {
    window.removeEventListener('scroll', aoRolar, true)
    window.removeEventListener('resize', aoRolar)
  }
})

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', aoRolar, true)
  window.removeEventListener('resize', aoRolar)
})
</script>

<template>
  <div
    ref="datePickerRef"
    class="flex flex-col gap-1.5 w-full text-left relative select-none"
    @keydown.esc="onEsc"
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
        :aria-describedby="error ? erroId : undefined"
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

    <!-- Erro: texto persistente abaixo do campo, anunciado por leitores de tela.
         O ícone + tooltip interno permanecem apenas como reforço visual. -->
    <p v-if="error" :id="erroId" role="alert" class="text-[11px] font-medium text-rose-700">
      {{ error }}
    </p>

    <!-- Popover com o Calendar -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-95"
    >
      <div
        v-if="isOpen"
        ref="popoverRef"
        :class="[
          'absolute z-50 max-w-[min(100%,calc(100vw-1rem))]',
          abreParaCima ? 'bottom-full mb-1' : 'top-full mt-1',
          alinhaDireita ? 'right-0' : 'left-0'
        ]"
      >
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
