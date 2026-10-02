<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Search, ChevronDown, X, Check, AlertCircle } from '@lucide/vue'
import Tooltip from './Tooltip.vue'

export interface SelectOption {
  value: string | number
  label: string
  badge?: string
  description?: string
}

interface Props {
  modelValue?: string | number
  options?: SelectOption[]
  label?: string
  labelClass?: string
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  clearable?: boolean
  leftIcon?: any
  helperText?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => [],
  label: '',
  labelClass: '',
  placeholder: 'Selecione uma opção...',
  searchPlaceholder: 'Digitar para pesquisar...',
  disabled: false,
  clearable: true,
  leftIcon: null,
  helperText: '',
  error: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const selectContainerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const highlightedIndex = ref(0)

// Id estável para associação label[for] ↔ gatilho
const triggerId = useId()
const labelId = `${triggerId}-label`
const listboxId = `${triggerId}-listbox`
const erroId = `${triggerId}-erro`
const optionId = (idx: number) => `${triggerId}-opt-${idx}`
const activeDescendant = computed(() =>
  isOpen.value && filteredOptions.value.length > 0 ? optionId(highlightedIndex.value) : undefined
)
const focusFromLabel = () => {
  triggerRef.value?.focus()
}

const selectedOption = computed(() => {
  return props.options.find((opt) => opt.value === props.modelValue) || null
})

// Normaliza texto para busca insensível a acentos e maiúsculas
const normalizeStr = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.options
  }
  const q = normalizeStr(searchQuery.value)
  return props.options.filter((opt) => {
    const labelMatch = normalizeStr(opt.label).includes(q)
    const valMatch = normalizeStr(String(opt.value)).includes(q)
    const descMatch = opt.description ? normalizeStr(opt.description).includes(q) : false
    const badgeMatch = opt.badge ? normalizeStr(opt.badge).includes(q) : false
    return labelMatch || valMatch || descMatch || badgeMatch
  })
})

const abreParaCima = ref(false)
const listboxRef = ref<HTMLElement | null>(null)

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
  const gatilho = triggerRef.value
  const lista = listboxRef.value
  if (!gatilho || !lista) return
  const rect = gatilho.getBoundingClientRect()
  const alturaLista = lista.offsetHeight
  const { superior, inferior } = limitesDeRolagem(gatilho.parentElement ?? gatilho)
  const espacoAbaixo = inferior - rect.bottom
  const espacoAcima = rect.top - superior
  abreParaCima.value = espacoAbaixo < alturaLista && espacoAcima > espacoAbaixo
}

function aoRolar() {
  if (isOpen.value) atualizarPosicao()
}

const openDropdown = () => {
  if (props.disabled) return
  isOpen.value = true
  searchQuery.value = ''
  highlightedIndex.value = 0
  nextTick(() => {
    atualizarPosicao()
    searchInputRef.value?.focus({ preventScroll: true })
    window.addEventListener('scroll', aoRolar, true)
    window.addEventListener('resize', aoRolar)
  })
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
  window.removeEventListener('scroll', aoRolar, true)
  window.removeEventListener('resize', aoRolar)
}

const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const selectOption = (opt: SelectOption) => {
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  closeDropdown()
}

const clearSelection = (e: MouseEvent) => {
  e.stopPropagation()
  emit('update:modelValue', '')
  emit('change', '')
}

// Navegação por teclado
const handleKeyDown = (e: KeyboardEvent) => {
  if (!isOpen.value) {
    if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault()
      openDropdown()
    }
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    closeDropdown()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (highlightedIndex.value < filteredOptions.value.length - 1) {
      highlightedIndex.value++
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (highlightedIndex.value > 0) {
      highlightedIndex.value--
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const opt = filteredOptions.value[highlightedIndex.value]
    if (opt) {
      selectOption(opt)
    }
  }
}

// Fechar ao clicar fora
const handleClickOutside = (e: MouseEvent) => {
  if (
    selectContainerRef.value &&
    !selectContainerRef.value.contains(e.target as Node)
  ) {
    closeDropdown()
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', aoRolar, true)
  window.removeEventListener('resize', aoRolar)
})

watch(filteredOptions, () => {
  highlightedIndex.value = 0
  if (isOpen.value) nextTick(atualizarPosicao)
})
</script>

<template>
  <div
    ref="selectContainerRef"
    class="flex flex-col gap-1.5 w-full text-left relative"
    @keydown="handleKeyDown"
  >
    <label
      v-if="label"
      :id="labelId"
      :for="triggerId"
      :class="['text-xs font-semibold text-slate-700 select-none flex items-center justify-between cursor-pointer', labelClass]"
      @click.prevent="focusFromLabel"
    >
      <span>{{ label }}</span>
    </label>

    <!-- Gatilho do Select: 34px de altura -->
    <div class="relative">
      <div
        ref="triggerRef"
        :id="triggerId"
        role="combobox"
        :aria-haspopup="'listbox'"
        :aria-expanded="isOpen"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendant"
        :aria-labelledby="labelId"
        :aria-describedby="error ? erroId : undefined"
        :aria-disabled="disabled"
        tabindex="0"
        :class="[
          'relative flex items-center justify-between bg-white border rounded-lg px-3 cursor-pointer transition-all select-none h-[34px] outline-none',
          error
            ? 'border-slate-200'
            : isOpen
              ? 'border-slate-300 border-b-brand-focus border-b-2 shadow-xs ring-0'
              : 'border-slate-200 hover:border-slate-300 focus:border-b-brand-focus focus:border-b-2',
          disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''
        ]"
        @click="toggleDropdown"
      >
        <div class="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <slot name="leftIcon">
            <component
              :is="leftIcon"
              v-if="leftIcon"
              class="h-4 w-4 text-slate-400 shrink-0"
            />
          </slot>

          <div v-if="selectedOption" class="flex items-center gap-2 truncate min-w-0">
            <span class="text-xs font-normal text-slate-900 truncate">
              {{ selectedOption.label }}
            </span>
            <span
              v-if="selectedOption.badge"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0"
            >
              {{ selectedOption.badge }}
            </span>
          </div>
          <span v-else class="text-xs text-slate-400 font-normal truncate">
            {{ placeholder }}
          </span>
        </div>

        <div class="flex items-center gap-1 shrink-0 ml-2">
          <slot name="rightIcon" />
          <button
            v-if="clearable && selectedOption && !disabled"
            type="button"
            class="text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none"
            @click="clearSelection"
          >
            <X class="h-3.5 w-3.5" />
          </button>
          <ChevronDown
            class="h-4 w-4 text-slate-400 transition-transform duration-200"
            :class="{ 'rotate-180 text-brand-focus': isOpen }"
          />
        </div>
      </div>

      <!-- Cantos inferiores em vermelho (clip-path igual ao Input) -->
      <div
        v-if="error"
        class="absolute -inset-[1px] rounded-lg border-2 border-rose-700 pointer-events-none transition-all duration-150 ds-bottom-clip"
      />

      <!-- Erro: apenas o ícone interno à direita, com tooltip exibindo a mensagem -->
      <div
        v-if="error"
        class="absolute right-8 top-1/2 -translate-y-1/2 z-10"
      >
        <Tooltip :content="error" position="top">
          <button
            type="button"
            aria-hidden="true"
            tabindex="-1"
            class="text-rose-700 hover:text-rose-800 flex items-center p-0.5 focus:outline-none"
          >
            <AlertCircle class="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- Erro: texto persistente abaixo do gatilho, anunciado por leitores de tela.
         O ícone + tooltip interno permanecem apenas como reforço visual. -->
    <p v-if="error" :id="erroId" role="alert" class="text-[11px] font-medium text-rose-700">
      {{ error }}
    </p>

    <!-- Dropdown / Popover -->
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
        ref="listboxRef"
        :class="[
          'absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col',
          abreParaCima ? 'bottom-full mb-1' : 'top-full mt-1'
        ]"
      >
        <!-- Busca Interna: 30px de altura -->
        <div class="px-2.5 pt-2.5 pb-2 border-b border-slate-100 bg-white space-y-1">
          <div class="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 h-[30px] bg-white focus-within:border-brand-focus transition-colors">
            <Search class="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              class="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              style="outline: none !important; box-shadow: none !important;"
            />
          </div>
          <p class="text-[10px] text-slate-400 pl-0.5">
            {{ filteredOptions.length }} opções encontradas
          </p>
        </div>

        <!-- Lista de Opções -->
        <div
          :id="listboxId"
          role="listbox"
          :aria-labelledby="labelId"
          class="max-h-60 overflow-y-auto divide-y divide-slate-50"
        >
          <div
            v-for="(opt, idx) in filteredOptions"
            :key="opt.value"
            :id="optionId(idx)"
            role="option"
            :aria-selected="opt.value === modelValue"
            :class="[
              'px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors',
              highlightedIndex === idx ? 'bg-lime-50/60 text-lime-950' : 'hover:bg-slate-50 text-slate-800',
              opt.value === modelValue ? 'font-semibold bg-slate-50' : ''
            ]"
            @click="selectOption(opt)"
            @mouseenter="highlightedIndex = idx"
          >
            <div class="flex flex-col gap-0.5 pr-2 min-w-0">
              <div class="flex items-center gap-2">
                <span class="truncate">{{ opt.label }}</span>
                <span
                  v-if="opt.badge"
                  class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0"
                >
                  {{ opt.badge }}
                </span>
              </div>
              <span v-if="opt.description" class="text-[10px] text-slate-400 font-normal">
                {{ opt.description }}
              </span>
            </div>

            <Check
              v-if="opt.value === modelValue"
              class="h-3.5 w-3.5 text-lime-700 shrink-0 ml-2"
            />
          </div>

          <div
            v-if="filteredOptions.length === 0"
            class="px-4 py-6 text-center text-xs text-slate-400"
          >
            Nenhum resultado encontrado para "{{ searchQuery }}"
          </div>
        </div>
      </div>
    </Transition>

    <p v-if="helperText" class="text-[11px] text-slate-500">
      {{ helperText }}
    </p>
  </div>
</template>
