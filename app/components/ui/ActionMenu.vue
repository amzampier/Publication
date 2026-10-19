<script setup lang="ts">
// UiActionMenu (docs/01 §5.23): agrupa as ações de linha de uma tabela em um
// menu suspenso acessível. Posicionado em `Teleport`/`fixed` para não ser
// recortado pelo `overflow` da tabela; fecha no Escape/clique-fora e devolve o
// foco ao gatilho. Itens desabilitados não recebem foco e expõem o motivo.
import { computed, nextTick, onMounted, onUnmounted, ref, useId, type Component } from 'vue'
import { MoreVertical } from '@lucide/vue'

export interface ActionMenuItem {
  id: string
  label: string
  icon?: Component
  /** Aparência do item (ações destrutivas usam `danger`). */
  tone?: 'default' | 'danger'
  disabled?: boolean
  /** Motivo exibido quando o item está desabilitado. */
  reason?: string
  /** Cor de fundo no hover (hex). Sobrepõe o destaque padrão do menu. */
  hoverBackground?: string
  /** Cor do texto no hover quando `hoverBackground` é informado. */
  hoverText?: string
}

interface Props {
  items: ActionMenuItem[]
  /** Rótulo acessível do gatilho. */
  label?: string
  /** Alinhamento horizontal do menu em relação ao gatilho. */
  align?: 'start' | 'end'
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Ações',
  align: 'end'
})

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const LARGURA_MENU = 208
const MARGEM = 8

const aberto = ref(false)
const indiceFoco = ref(-1)
// Destaque do item controlado pelo Vue (mouseenter/leave): garante a mudança
// visual mesmo se a variante CSS `hover:` não for aplicada (ex.: CSS em cache),
// e também marca o item focado por teclado.
const itemDestacado = ref<string | null>(null)
const gatilhoRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const idMenu = useId()
const posicao = ref({ top: '0px', left: '0px' })

const itens = computed(() => props.items)
const indicesHabilitados = computed(() =>
  itens.value.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0)
)

const destacar = (item: ActionMenuItem) => {
  if (!item.disabled) itemDestacado.value = item.id
}
const desmarcar = (item: ActionMenuItem) => {
  if (itemDestacado.value === item.id) itemDestacado.value = null
}

/** Cor de destaque específica do item (texto e/ou fundo), sobrepondo ao padrão. */
const estiloDestaque = (item: ActionMenuItem) => {
  if (itemDestacado.value !== item.id) return undefined
  if (!item.hoverBackground && !item.hoverText) return undefined
  return {
    // Só texto: mantém o fundo neutro/transparente para a cor não ficar apagada.
    backgroundColor: item.hoverBackground ?? 'transparent',
    ...(item.hoverText ? { color: item.hoverText } : {})
  }
}

const focarItem = (idx: number) => {
  if (idx < 0) return
  const nodes = menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]')
  nodes?.[idx]?.focus()
}

const abrir = () => {
  const r = gatilhoRef.value?.getBoundingClientRect()
  aberto.value = true
  indiceFoco.value = -1
  void nextTick(() => {
    const altura = menuRef.value?.offsetHeight ?? 0
    const abaixo = r ? r.bottom + 6 : MARGEM
    const acima = r ? r.top - altura - 6 : MARGEM
    const top = abaixo + altura > window.innerHeight - MARGEM && acima > MARGEM ? acima : abaixo
    const left = r
      ? props.align === 'end'
        ? Math.max(MARGEM, r.right - LARGURA_MENU)
        : Math.min(r.left, window.innerWidth - LARGURA_MENU - MARGEM)
      : MARGEM
    posicao.value = { top: `${top}px`, left: `${left}px` }
    mover(1)
  })
}

const fechar = (devolverFoco = true) => {
  aberto.value = false
  indiceFoco.value = -1
  itemDestacado.value = null
  if (devolverFoco) gatilhoRef.value?.focus()
}

const alternar = () => (aberto.value ? fechar() : abrir())

const mover = (passo: number) => {
  const idxs = indicesHabilitados.value
  if (!idxs.length) return
  const atual = idxs.indexOf(indiceFoco.value)
  const proximo =
    atual === -1 ? (passo > 0 ? 0 : idxs.length - 1) : (atual + passo + idxs.length) % idxs.length
  const alvo = idxs[proximo]
  if (alvo === undefined) return
  indiceFoco.value = alvo
  focarItem(alvo)
}

const acionar = (item: ActionMenuItem) => {
  if (item.disabled) return
  emit('select', item.id)
  fechar()
}

const onKeydownMenu = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    fechar()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    mover(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    mover(-1)
  } else if (e.key === 'Home') {
    e.preventDefault()
    indiceFoco.value = -1
    mover(1)
  } else if (e.key === 'End') {
    e.preventDefault()
    indiceFoco.value = itens.value.length
    mover(-1)
  }
}

const onKeydownGatilho = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
    e.preventDefault()
    abrir()
  }
}

const onDocPointer = (e: MouseEvent) => {
  if (!aberto.value) return
  const alvo = e.target as Node | null
  if (!alvo) return
  if (menuRef.value?.contains(alvo) || gatilhoRef.value?.contains(alvo)) return
  fechar(false)
}

const onDocKey = (e: KeyboardEvent) => {
  if (aberto.value && e.key === 'Escape') fechar()
}

const onScrollResize = () => {
  if (aberto.value) fechar(false)
}

onMounted(() => {
  document.addEventListener('mousedown', onDocPointer)
  document.addEventListener('keydown', onDocKey)
  window.addEventListener('scroll', onScrollResize, true)
  window.addEventListener('resize', onScrollResize)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocPointer)
  document.removeEventListener('keydown', onDocKey)
  window.removeEventListener('scroll', onScrollResize, true)
  window.removeEventListener('resize', onScrollResize)
})
</script>

<template>
  <div class="relative inline-flex">
    <button
      ref="gatilhoRef"
      type="button"
      class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
      :aria-label="label"
      aria-haspopup="menu"
      :aria-expanded="aberto"
      :aria-controls="aberto ? idMenu : undefined"
      @click="alternar"
      @keydown="onKeydownGatilho"
    >
      <MoreVertical class="h-4 w-4" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <div
        v-if="aberto"
        :id="idMenu"
        ref="menuRef"
        role="menu"
        :aria-label="label"
        class="fixed z-50 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        :style="{ top: posicao.top, left: posicao.left, width: `${LARGURA_MENU}px` }"
        @keydown="onKeydownMenu"
      >
        <button
          v-for="item in itens"
          :key="item.id"
          type="button"
          role="menuitem"
          :tabindex="-1"
          :disabled="item.disabled"
          :aria-label="item.disabled && item.reason ? `${item.label} — ${item.reason}` : item.label"
          :title="item.disabled ? item.reason : undefined"
          :style="estiloDestaque(item)"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-focus"
          :class="[
            item.disabled
              ? 'cursor-not-allowed text-slate-400'
              : item.tone === 'danger'
                ? [
                    'text-rose-700',
                    itemDestacado === item.id
                      ? 'bg-rose-200 text-rose-900'
                      : 'hover:bg-rose-200 hover:text-rose-900'
                  ]
                : [
                    'text-slate-700',
                    itemDestacado === item.id
                      ? 'bg-slate-200 text-slate-900'
                      : 'hover:bg-slate-200 hover:text-slate-900'
                  ]
          ]"
          @click="acionar(item)"
          @focus="indiceFoco = itens.indexOf(item)"
          @blur="desmarcar(item)"
          @mouseenter="destacar(item)"
          @mouseleave="desmarcar(item)"
        >
          <component :is="item.icon" v-if="item.icon" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ item.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>
