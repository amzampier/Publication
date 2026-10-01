<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
/** @deprecated Use os valores em inglês (top, bottom, left, right) */
export type TooltipPositionLegacy = 'topo' | 'rodape' | 'esquerda' | 'direita'
export type TooltipTheme = 'dark' | 'light'

interface Props {
  content?: string
  position?: TooltipPosition | TooltipPositionLegacy
  theme?: TooltipTheme
  delay?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  position: 'top',
  theme: 'dark',
  delay: 150,
  disabled: false
})

const isVisible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const wrapperRef = ref<HTMLElement | null>(null)
const bubbleRef = ref<HTMLElement | null>(null)
const deslocamento = ref({ x: 0, y: 0 })
const deslocamentoSeta = ref({ x: 0, y: 0 })

/** Margem mínima em relação às bordas do viewport e do ancestral que recorta. */
const MARGEM = 8
/** Distância do balão ao gatilho (equivale a mb-2/mt-2/ml-2/mr-2). */
const DESLOCAMENTO_PADRAO = 8

/** Interceta os retângulos de todos os ancestrais com overflow que recortam o balão. */
const retanguloDeRecorte = (el: HTMLElement) => {
  let r = {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight
  }
  let p = el.parentElement
  while (p && p !== document.documentElement) {
    const s = getComputedStyle(p)
    if (s.overflow !== 'visible' || s.overflowX !== 'visible' || s.overflowY !== 'visible') {
      const c = p.getBoundingClientRect()
      r = {
        left: Math.max(r.left, c.left),
        top: Math.max(r.top, c.top),
        right: Math.min(r.right, c.right),
        bottom: Math.min(r.bottom, c.bottom)
      }
    }
    p = p.parentElement
  }
  return r
}

/**
 * Desloca o balão para dentro do espaço visível quando ele seria cortado
 * (painel do modal com overflow-hidden, viewport, corpo rolável etc.).
 * Usa a propriedade CSS `translate`, que não colide com o `transform`
 * das classes do Tailwind nem com a escala da Transition de entrada.
 */
const ajustarPosicao = () => {
  const bubble = bubbleRef.value
  const wrapper = wrapperRef.value
  if (!bubble || !wrapper) return

  const wr = wrapper.getBoundingClientRect()
  const w = bubble.offsetWidth
  const h = bubble.offsetHeight

  // Posição natural do balão, sem o deslocamento de correção.
  let esq: number
  let topo: number
  switch (normalizedPosition.value) {
    case 'top':
      esq = wr.left + (wr.width - w) / 2
      topo = wr.top - h - DESLOCAMENTO_PADRAO
      break
    case 'bottom':
      esq = wr.left + (wr.width - w) / 2
      topo = wr.bottom + DESLOCAMENTO_PADRAO
      break
    case 'left':
      esq = wr.left - w - DESLOCAMENTO_PADRAO
      topo = wr.top + (wr.height - h) / 2
      break
    case 'right':
    default:
      esq = wr.right + DESLOCAMENTO_PADRAO
      topo = wr.top + (wr.height - h) / 2
      break
  }

  const r = retanguloDeRecorte(wrapper)
  const limE = Math.max(MARGEM, r.left + MARGEM)
  const limD = Math.min(window.innerWidth - MARGEM, r.right - MARGEM)
  const limT = Math.max(MARGEM, r.top + MARGEM)
  const limB = Math.min(window.innerHeight - MARGEM, r.bottom - MARGEM)

  let dx = 0
  let dy = 0
  if (esq < limE) dx = limE - esq
  else if (esq + w > limD) dx = limD - (esq + w)
  if (topo < limT) dy = limT - topo
  else if (topo + h > limB) dy = limB - (topo + h)

  deslocamento.value = { x: Math.round(dx), y: Math.round(dy) }

  // A seta acompanha a correção para continuar apontando ao gatilho,
  // mas sem sair da borda do balão.
  const horizontal = normalizedPosition.value === 'top' || normalizedPosition.value === 'bottom'
  const folga = horizontal ? Math.max(0, w / 2 - 8) : Math.max(0, h / 2 - 8)
  const correcao = horizontal ? -dx : -dy
  const limitado = Math.max(-folga, Math.min(folga, correcao))
  deslocamentoSeta.value = horizontal
    ? { x: Math.round(limitado), y: 0 }
    : { x: 0, y: Math.round(limitado) }
}

const normalizedPosition = computed(() => {
  switch (props.position) {
    case 'top':
    case 'topo':
      return 'top'
    case 'bottom':
    case 'rodape':
      return 'bottom'
    case 'left':
    case 'esquerda':
      return 'left'
    case 'right':
    case 'direita':
    default:
      return 'right'
  }
})

const positionClasses = computed(() => {
  switch (normalizedPosition.value) {
    case 'top':
      return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    case 'bottom':
      return 'top-full left-1/2 -translate-x-1/2 mt-2'
    case 'left':
      return 'right-full top-1/2 -translate-y-1/2 mr-2'
    case 'right':
    default:
      return 'left-full top-1/2 -translate-y-1/2 ml-2'
  }
})

const arrowClasses = computed(() => {
  const isDark = props.theme === 'dark'
  switch (normalizedPosition.value) {
    case 'top':
      return `top-full left-1/2 -translate-x-1/2 border-t-4 border-x-4 border-b-0 border-x-transparent ${
        isDark ? 'border-t-slate-900' : 'border-t-white'
      }`
    case 'bottom':
      return `bottom-full left-1/2 -translate-x-1/2 border-b-4 border-x-4 border-t-0 border-x-transparent ${
        isDark ? 'border-b-slate-900' : 'border-b-white'
      }`
    case 'left':
      return `left-full top-1/2 -translate-y-1/2 border-l-4 border-y-4 border-r-0 border-y-transparent ${
        isDark ? 'border-l-slate-900' : 'border-l-white'
      }`
    case 'right':
    default:
      return `right-full top-1/2 -translate-y-1/2 border-r-4 border-y-4 border-l-0 border-y-transparent ${
        isDark ? 'border-r-slate-900' : 'border-r-white'
      }`
  }
})

const themeClasses = computed(() => {
  return props.theme === 'dark'
      ? 'bg-brand-primary text-white shadow-md'
    : 'bg-white text-slate-800 border border-slate-200 shadow-md'
})

const show = () => {
  if (props.disabled) return
  timer = setTimeout(() => {
    isVisible.value = true
    nextTick(() => {
      ajustarPosicao()
      requestAnimationFrame(ajustarPosicao)
    })
    window.addEventListener('scroll', ajustarPosicao, true)
    window.addEventListener('resize', ajustarPosicao)
  }, props.delay)
}

const hide = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  // O deslocamento é mantido durante o fade de saída (senão o balão "pula"
  // de volta para a posição natural) e só é zerado no after-leave.
  isVisible.value = false
  window.removeEventListener('scroll', ajustarPosicao, true)
  window.removeEventListener('resize', ajustarPosicao)
}

const limparDeslocamento = () => {
  deslocamento.value = { x: 0, y: 0 }
  deslocamentoSeta.value = { x: 0, y: 0 }
}

onUnmounted(() => {
  window.removeEventListener('scroll', ajustarPosicao, true)
  window.removeEventListener('resize', ajustarPosicao)
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="relative inline-flex items-center"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
      @after-leave="limparDeslocamento"
    >
      <div
        v-if="isVisible && (content || $slots.content)"
        ref="bubbleRef"
        :style="{ translate: `${deslocamento.x}px ${deslocamento.y}px` }"
        :class="[
          'absolute z-50 whitespace-nowrap rounded px-2.5 py-1 text-[11px] font-medium pointer-events-none',
          positionClasses,
          themeClasses
        ]"
      >
        <slot name="content">{{ content }}</slot>
        <span
          :style="{ translate: `${deslocamentoSeta.x}px ${deslocamentoSeta.y}px` }"
          :class="['absolute w-0 h-0', arrowClasses]"
        ></span>
      </div>
    </Transition>
  </div>
</template>
