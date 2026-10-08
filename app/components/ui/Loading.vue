<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { LoaderCircle } from '@lucide/vue'

export type LoadingSize = 'sm' | 'md' | 'lg'

interface Props {
  message?: string
  size?: LoadingSize
  current?: number
  total?: number
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Carregando…',
  size: 'md'
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return { panel: 'px-3 py-2', gap: 'gap-2', icon: 'h-5 w-5', text: 'text-xs' }
    case 'lg':
      return { panel: 'px-6 py-4', gap: 'gap-3', icon: 'h-8 w-8', text: 'text-base' }
    case 'md':
    default:
      return { panel: 'px-5 py-4', gap: 'gap-3', icon: 'h-6 w-6', text: 'text-sm' }
  }
})

// Progresso opcional: só current/total finitos com total > 0 habilitam o bloco;
// qualquer outro caso (ausente, NaN, Infinity, total <= 0) renderiza apenas a
// linha de ícone + mensagem, como se as props não existissem.
const hasProgress = computed(() =>
  Number.isFinite(props.current) && Number.isFinite(props.total) && (props.total as number) > 0
)

const progressPercent = computed(() => {
  if (!hasProgress.value) return 0
  const pct = ((props.current as number) / (props.total as number)) * 100
  return Math.min(100, Math.max(0, pct))
})

const progressRounded = computed(() => Math.round(progressPercent.value))

const counterLabel = computed(() => {
  if (!hasProgress.value) return ''
  return `${(props.current as number).toLocaleString('pt-BR')} / ${(props.total as number).toLocaleString('pt-BR')}`
})

const progressText = computed(() =>
  hasProgress.value ? `${progressRounded.value}% — ${counterLabel.value}` : ''
)

// Trava de rolagem enquanto o overlay existe — mesmo contrato do lockScroll do UiModal.
// onMounted/onUnmounted só executam no cliente (a guarda de SSR é implícita) e o foco
// não é movido: o overlay não tem controles focáveis.
let scrollLocked = false

onMounted(() => {
  if (!scrollLocked) {
    document.body.style.overflow = 'hidden'
    scrollLocked = true
  }
})

onUnmounted(() => {
  if (scrollLocked) {
    document.body.style.overflow = ''
    scrollLocked = false
  }
})
</script>

<template>
  <Teleport to="body">
    <!-- Hierarquia de camadas do sistema: header z-40 < dropdowns/toasts z-50 < UiModal
         z-60 < UiLoading z-70. Sem fechamento próprio (clique/Escape não fecham) — o
         consumidor remove o componente com v-if; no-print: o overlay não vai ao papel. -->
    <div
      class="fixed inset-0 z-[70] flex items-center justify-center p-4 no-print"
      aria-busy="true"
    >
      <div class="absolute inset-0 bg-zinc-900/50" aria-hidden="true" />

      <div class="ds-loading">
        <div
          class="relative z-[1] bg-white rounded-[10px]"
          :class="[
            sizeClasses.panel,
            hasProgress ? 'flex flex-col min-w-[280px]' : 'flex items-center'
          ]"
        >
          <div class="flex items-center" :class="sizeClasses.gap">
            <LoaderCircle
              :class="[
                sizeClasses.icon,
                'animate-spin motion-reduce:animate-none text-brand-structure shrink-0'
              ]"
              aria-hidden="true"
            />
            <p
              class="font-medium text-slate-700"
              :class="sizeClasses.text"
              role="status"
              aria-live="polite"
            >
              {{ message }}
            </p>
          </div>

          <!-- Bloco de progresso opcional: trilha slate-200 (mesma da UiSlider) com fill
               no degradê da marca via tokens — nenhum hex aqui (req. de brand-tokens). -->
          <div v-if="hasProgress" class="mt-3 space-y-1.5">
            <div
              class="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden"
              role="progressbar"
              :aria-valuenow="progressRounded"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuetext="progressText"
            >
              <div
                class="h-full rounded-full bg-gradient-to-r from-brand-primary via-brand-structure to-brand-accent transition-[width] duration-300 ease-out motion-reduce:transition-none"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
            <div
              class="flex items-center justify-between font-medium text-slate-500 text-[11px]"
            >
              <span class="font-mono tabular-nums">{{ counterLabel }}</span>
              <span class="font-mono tabular-nums">{{ progressRounded }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
