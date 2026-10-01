<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

interface Props {
  modelValue?: Date | string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', date: Date): void
  (e: 'change', date: Date): void
  (e: 'select', date: Date): void
}>()

// Getter dinâmico da data corrente (nunca congela na instância do componente)
const getToday = () => new Date()
const currentMonth = ref(getToday().getMonth())
const currentYear = ref(getToday().getFullYear())

// Converter modelValue para Date
const selectedDate = computed(() => {
  if (!props.modelValue) return null
  if (props.modelValue instanceof Date) return props.modelValue
  const parsed = new Date(props.modelValue)
  return isNaN(parsed.getTime()) ? null : parsed
})

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Navegação de mês
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// Dias do calendário
const calendarDays = computed(() => {
  const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = []
  const t = getToday()
  const firstDayIndex = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const lastDate = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const prevMonthLastDate = new Date(currentYear.value, currentMonth.value, 0).getDate()

  // Dias do mês anterior
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(currentYear.value, currentMonth.value - 1, prevMonthLastDate - i)
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, t),
      isSelected: selectedDate.value ? isSameDay(d, selectedDate.value) : false
    })
  }

  // Dias do mês atual
  for (let i = 1; i <= lastDate; i++) {
    const d = new Date(currentYear.value, currentMonth.value, i)
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: isSameDay(d, t),
      isSelected: selectedDate.value ? isSameDay(d, selectedDate.value) : false
    })
  }

  // Dias do próximo mês para completar grid de 35 ou 42 células
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(currentYear.value, currentMonth.value + 1, i)
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, t),
      isSelected: selectedDate.value ? isSameDay(d, selectedDate.value) : false
    })
  }

  return days
})

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

const selectDay = (day: { date: Date }) => {
  emit('update:modelValue', day.date)
  emit('change', day.date)
  emit('select', day.date)
  focusedDate.value = day.date
  // Atualiza visão se clicou em outro mês
  currentMonth.value = day.date.getMonth()
  currentYear.value = day.date.getFullYear()
}

const goToToday = () => {
  const t = getToday()
  currentMonth.value = t.getMonth()
  currentYear.value = t.getFullYear()
  emit('update:modelValue', t)
  emit('change', t)
  emit('select', t)
}

// ==========================================
// NAVEGAÇÃO POR TECLADO (roving tabindex)
// ==========================================
const calId = useId()
const focusedDate = ref<Date | null>(null)

const dayCellId = (d: Date) =>
  `${calId}-d-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

// Data cuja célula recebe tabindex=0: foco explícito > selecionada > hoje > 1º dia do mês
const tabbableDate = computed<Date>(() => {
  if (focusedDate.value) return focusedDate.value
  if (selectedDate.value) return selectedDate.value
  const t = getToday()
  if (t.getMonth() === currentMonth.value && t.getFullYear() === currentYear.value) {
    return t
  }
  return new Date(currentYear.value, currentMonth.value, 1)
})

const focusDate = (d: Date) => {
  focusedDate.value = d
  if (d.getMonth() !== currentMonth.value || d.getFullYear() !== currentYear.value) {
    currentMonth.value = d.getMonth()
    currentYear.value = d.getFullYear()
  }
  nextTick(() => {
    document.getElementById(dayCellId(d))?.focus()
  })
}

const handleGridKeydown = (e: KeyboardEvent) => {
  const base = focusedDate.value || selectedDate.value || getToday()
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())

  switch (e.key) {
    case 'ArrowLeft':
      d.setDate(d.getDate() - 1)
      break
    case 'ArrowRight':
      d.setDate(d.getDate() + 1)
      break
    case 'ArrowUp':
      d.setDate(d.getDate() - 7)
      break
    case 'ArrowDown':
      d.setDate(d.getDate() + 7)
      break
    default:
      return
  }
  e.preventDefault()
  focusDate(d)
}

// Linhas de 7 dias para estrutura role=grid > row > gridcell
const dayRows = computed(() => {
  const rows: (typeof calendarDays.value)[] = []
  for (let i = 0; i < calendarDays.value.length; i += 7) {
    rows.push(calendarDays.value.slice(i, i + 7))
  }
  return rows
})
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs w-72 select-none">
    <!-- Cabeçalho de Navegação -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-slate-800 tracking-tight">
          {{ monthNames[currentMonth] }} {{ currentYear }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          aria-label="Mês anterior"
          class="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
          @click="prevMonth"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Próximo mês"
          class="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
          @click="nextMonth"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Dias da Semana -->
    <div class="grid grid-cols-7 gap-1 text-center mb-1">
      <span
        v-for="wd in weekDays"
        :key="wd"
        class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-1"
      >
        {{ wd }}
      </span>
    </div>

    <!-- Grade dos Dias (role=grid com navegação por setas) -->
    <div
      role="grid"
      :aria-label="`Calendário de ${monthNames[currentMonth]} ${currentYear}`"
      class="flex flex-col gap-1 text-center"
      @keydown="handleGridKeydown"
    >
      <div
        v-for="(week, wIdx) in dayRows"
        :key="wIdx"
        role="row"
        class="grid grid-cols-7 gap-1"
      >
        <button
          v-for="(day, idx) in week"
          :key="idx"
          :id="dayCellId(day.date)"
          type="button"
          role="gridcell"
          :tabindex="isSameDay(day.date, tabbableDate) ? 0 : -1"
          :aria-selected="day.isSelected"
          :aria-label="day.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })"
          :aria-current="day.isToday ? 'date' : undefined"
          :class="[
            'h-8 w-8 mx-auto rounded-lg text-xs font-medium flex flex-col items-center justify-center relative transition-all',
            !day.isCurrentMonth ? 'text-slate-300' : 'text-slate-700',
            // Dia selecionado
            day.isSelected
              ? day.isToday
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'bg-brand-primary text-white font-bold shadow-xs'
              : day.isToday
                // Destaque mandatório do Hoje em emerald-700 (verde esmeralda corporativo)
                ? 'border-[1.5px] border-emerald-700 bg-emerald-50/70 text-emerald-700 font-bold hover:bg-emerald-100'
                : 'hover:bg-slate-100'
          ]"
          @click="selectDay(day)"
        >
          <span>{{ day.date.getDate() }}</span>
          <!-- Micro-indicador inferior para o dia de Hoje -->
          <span
            v-if="day.isToday && !day.isSelected"
            class="absolute bottom-0.5 h-1 w-1 rounded-full bg-emerald-700"
          ></span>
        </button>
      </div>
    </div>

    <!-- Rodapé com Botão Atalho Hoje -->
    <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
      <span class="text-[10px] text-slate-400 font-medium">
        Hoje: {{ getToday().toLocaleDateString('pt-BR') }}
      </span>
      <button
        type="button"
        class="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded hover:bg-emerald-50 transition-colors focus:outline-none"
        @click="goToToday"
      >
        Hoje
      </button>
    </div>
  </div>
</template>
