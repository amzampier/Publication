<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  X
} from '@lucide/vue'
import { useToast, type ToastType } from '../../composables/useToast'

const { toasts, remove } = useToast()

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        card: 'bg-emerald-50/95 border-emerald-200/90 text-emerald-950',
        badge: 'bg-emerald-100/90 text-emerald-700',
        bar: 'bg-emerald-500',
        icon: CheckCircle2
      }
    case 'warning':
      return {
        card: 'bg-orange-50/95 border-orange-200/90 text-orange-950',
        badge: 'bg-orange-100/90 text-orange-700',
        bar: 'bg-orange-500',
        icon: AlertTriangle
      }
    case 'danger':
      return {
        card: 'bg-rose-50/95 border-rose-200/90 text-rose-950',
        badge: 'bg-rose-100/90 text-rose-700',
        bar: 'bg-rose-500',
        icon: AlertOctagon
      }
    case 'info':
    default:
      return {
        card: 'bg-sky-50/95 border-sky-200/90 text-sky-950',
        badge: 'bg-sky-100/90 text-sky-700',
        bar: 'bg-sky-500',
        icon: Info
      }
  }
}

// Auto-dismiss com timer individual por toast (um timeout por toast,
// em vez de um polling global varrendo a lista a cada 100ms)
const timers = new Map<string, ReturnType<typeof setTimeout>>()

const clearTimer = (id: string) => {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

watch(
  toasts,
  (list) => {
    // Cancela timers de toasts que já saíram da lista (fechados manualmente)
    for (const id of [...timers.keys()]) {
      if (!list.some((t) => t.id === id)) {
        clearTimer(id)
      }
    }
    // Agenda o auto-dismiss de cada toast novo com duração
    for (const item of list) {
      if (item.duration > 0 && !timers.has(item.id)) {
        timers.set(
          item.id,
          setTimeout(() => remove(item.id), item.duration)
        )
      }
    }
  },
  { deep: true }
)

onUnmounted(() => {
  for (const id of [...timers.keys()]) {
    clearTimer(id)
  }
})
</script>

<template>
  <div
    class="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transform transition duration-300 ease-out"
      enter-from-class="translate-x-full opacity-0 scale-95"
      enter-to-class="translate-x-0 opacity-100 scale-100"
      leave-active-class="transform transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <div
        v-for="item in toasts"
        :key="item.id"
        :class="[
          'relative overflow-hidden pointer-events-auto shadow-lg rounded-xl border backdrop-blur-xs p-3.5 transition-all',
          getToastConfig(item.type).card
        ]"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-2.5">
          <div class="flex items-center gap-2">
            <div
              :class="[
                'p-1 rounded-md shrink-0 flex items-center justify-center',
                getToastConfig(item.type).badge
              ]"
            >
              <component
                :is="getToastConfig(item.type).icon"
                class="h-4 w-4"
              />
            </div>
            <h4 class="text-xs font-bold leading-tight tracking-tight">
              {{ item.title }}
            </h4>
          </div>

          <button
            type="button"
            class="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors focus:outline-none"
            @click="remove(item.id)"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Body -->
        <p v-if="item.message" class="mt-1.5 ml-7 text-[11px] leading-relaxed opacity-90 font-medium">
          {{ item.message }}
        </p>

        <!-- Barra de Progresso Sutil (2.5px) -->
        <div
          v-if="item.duration > 0"
          class="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/5 overflow-hidden"
        >
          <div
            :class="['h-full origin-left transition-all', getToastConfig(item.type).bar]"
            :style="{
              animation: `fp-toast-progress ${item.duration}ms linear forwards`
            }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<!-- Keyframe fora de <style scoped>: o Vue renomeia keyframes escopadas
     (toast-progress -> toast-progress-<hash>), quebrando a referência
     dinâmica do :style. Nome global único evita colisão. -->
<style>
@keyframes fp-toast-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>
