<script lang="ts">
// Pilha de modais abertos, em ordem de abertura (docs/01 §5.12): só o topo da
// pilha reage a Escape/Tab. Um modal filho (ex.: câmera sobre um formulário)
// não fecha nem rouba o foco do modal subjacente; com um único modal aberto a
// pilha tem um elemento e o comportamento é o mesmo de sempre.
// Escopo de módulo: declarado no <script> comum para ser compartilhado por
// todas as instâncias (<script setup> roda por instância).
const pilhaModais: symbol[] = []
</script>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import Tooltip from './Tooltip.vue'

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  modelValue: boolean
  title: string
  subtitle?: string
  icon?: any
  size?: ModalSize
  closeOnEsc?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: null,
  size: 'md',
  closeOnEsc: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const idModal = Symbol('ui-modal')

const desempilhar = () => {
  const i = pilhaModais.indexOf(idModal)
  if (i > -1) pilhaModais.splice(i, 1)
}

const ehTopoDaPilha = () => pilhaModais.at(-1) === idModal

const panelRef = ref<HTMLElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)
let scrollLocked = false

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'max-w-[384px]'
    case 'sm':
      return 'max-w-[480px]'
    case 'lg':
      return 'max-w-[880px]'
    case 'xl':
      return 'max-w-[1120px]'
    case 'md':
    default:
      return 'max-w-[640px]'
  }
})

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const getFocusable = () => {
  if (!panelRef.value) return []
  return Array.from(panelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null
  )
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!props.modelValue) return
  // Modal subjacente não responde enquanto outro está aberto por cima
  if (!ehTopoDaPilha()) return

  if (e.key === 'Escape' && props.closeOnEsc) {
    e.preventDefault()
    close()
    return
  }

  if (e.key !== 'Tab') return

  const nodes = getFocusable()
  const first = nodes.at(0)
  const last = nodes.at(-1)
  if (!first || !last) return

  const active = document.activeElement as HTMLElement | null
  const inside = active !== null && panelRef.value?.contains(active) === true

  if (e.shiftKey) {
    if (!inside || active === first) {
      e.preventDefault()
      last.focus()
    }
  } else if (!inside || active === last) {
    e.preventDefault()
    first.focus()
  }
}

const lockScroll = () => {
  if (!scrollLocked) {
    document.body.style.overflow = 'hidden'
    scrollLocked = true
  }
}

const unlockScroll = () => {
  if (scrollLocked) {
    document.body.style.overflow = ''
    scrollLocked = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (import.meta.server) return

    if (open) {
      pilhaModais.push(idModal)
      previousFocus.value = document.activeElement as HTMLElement | null
      lockScroll()
      window.addEventListener('keydown', handleKeydown)
      nextTick(() => {
        const firstNode = getFocusable().at(0)
        if (firstNode) firstNode.focus()
        else panelRef.value?.focus()
      })
    } else {
      desempilhar()
      window.removeEventListener('keydown', handleKeydown)
      unlockScroll()
      previousFocus.value?.focus()
      previousFocus.value = null
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  desempilhar()
  window.removeEventListener('keydown', handleKeydown)
  unlockScroll()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[60] flex items-center justify-center p-4 no-print">
        <div class="absolute inset-0 bg-zinc-900/50" aria-hidden="true" />

      <div
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        class="relative w-full bg-white rounded-xl shadow-2xl flex flex-col outline-none overflow-hidden max-h-[calc(100vh-2rem)]"
        :class="sizeClass"
      >
        <div class="flex items-center gap-3 bg-gradient-to-r from-brand-primary to-brand-structure rounded-t-xl border-l-[2.5px] border-l-brand-accent px-4 py-3.5">
          <component :is="icon" v-if="icon" class="h-4 w-4 text-white shrink-0" aria-hidden="true" />
          <div class="w-px self-stretch bg-white/20 shrink-0" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <h2 class="text-sm font-bold text-white leading-tight truncate">{{ title }}</h2>
            <p v-if="subtitle" class="text-[11px] text-white/90 leading-tight truncate mt-0.5">
              {{ subtitle }}
            </p>
          </div>
          <Tooltip content="Fechar" position="bottom">
            <button
              type="button"
              aria-label="Fechar"
              class="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors shrink-0"
              @click="close"
            >
              <X class="h-4 w-4" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>

        <div class="bg-slate-100 px-5 pb-5 pt-[15px] overflow-y-auto min-h-0 flex-1 fp-modal-body">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="border-t-[1px] border-lime-500 bg-white px-5 py-3.5 flex items-center justify-end gap-2.5"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fp-modal-body :deep(label:not([class*='text-rose'])) {
  font-weight: 300;
  color: #64748b;
}
</style>
