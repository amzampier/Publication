<script setup lang="ts">
import { type Component } from 'vue'
import { type BadgeVariant } from './Badge.vue'

export interface EntityCardLinha {
  rotulo: string
  valor: string
  icone?: Component
}

export interface EntityCardBadge {
  label: string
  variant?: BadgeVariant
}

interface Props {
  /** Identificador secundário exibido no topo (ex.: PAR-001), em mono. */
  codigo?: string
  /** Badge de status no topo (ex.: situação Ativo/Inativo/Bloqueado). */
  badge?: EntityCardBadge
  /** Ícone da entidade, exibido à esquerda do título (ex.: Handshake). */
  icone?: Component
  /** Título do card (ex.: razão social). */
  titulo: string
  /** Subtítulo do card (ex.: nome fantasia). */
  subtitulo?: string
  /** Linhas rótulo → valor (ex.: Localização, Região). */
  linhas?: EntityCardLinha[]
}

withDefaults(defineProps<Props>(), {
  codigo: '',
  badge: undefined,
  icone: undefined,
  subtitulo: '',
  linhas: () => []
})
</script>

<template>
  <article
    class="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-colors hover:border-slate-300"
  >
    <!-- Topo: código + badge à esquerda, ações no hover/foco à direita -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <span
          v-if="codigo"
          class="font-mono text-[11px] font-semibold tracking-tight text-slate-500"
        >
          {{ codigo }}
        </span>
        <UiBadge v-if="badge" :variant="badge.variant ?? 'neutral'" size="sm">
          {{ badge.label }}
        </UiBadge>
      </div>

      <!-- Ações: aparecem no hover do card e no foco de teclado (group-focus-within),
           permanecendo focáveis mesmo quando ocultas. -->
      <div
        v-if="$slots.acoes"
        class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <slot name="acoes" />
      </div>
    </div>

    <!-- Título e subtítulo -->
    <div class="mt-2.5 flex min-w-0 items-start gap-2.5">
      <span
        v-if="icone"
        class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
      >
        <component :is="icone" class="h-4 w-4" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <h3 class="break-words text-sm font-bold tracking-tight text-slate-900">
          {{ titulo }}
        </h3>
        <p v-if="subtitulo" class="mt-0.5 break-words text-xs text-slate-500">
          {{ subtitulo }}
        </p>
      </div>
    </div>

    <!-- Linha divisória verde + bloco de linhas em container recuado (cinza claro) -->
    <div v-if="linhas.length" class="mt-3 border-t border-brand-focus pt-3">
      <dl class="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div
          v-for="(linha, idx) in linhas"
          :key="idx"
          class="flex items-center justify-between gap-3"
        >
          <dt class="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <component :is="linha.icone" v-if="linha.icone" class="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {{ linha.rotulo }}
          </dt>
          <dd class="break-words text-right text-xs font-semibold text-slate-900">
            {{ linha.valor }}
          </dd>
        </div>
      </dl>
    </div>

    <slot />
  </article>
</template>
