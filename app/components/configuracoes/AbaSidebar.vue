<script setup lang="ts">
import { computed, watch, type Component } from 'vue'
import {
  ArrowLeftRight,
  BookOpen,
  Boxes,
  Folder,
  FolderOpen,
  PanelLeft,
  PanelLeftOpen,
  PanelLeftClose,
  Settings,
  SlidersHorizontal
} from '@lucide/vue'
import { useSessoesAbertas } from '../../composables/useSessoesAbertas'
import { useSidebarExpandida } from '../../composables/useSidebarExpandida'
import { sessoes } from '../../config/navigation'

// Avisa a página quando qualquer seleção muda (habilita o botão "Salvar")
const emit = defineEmits<{
  (e: 'change'): void
}>()

// Estado em memória (fase 1 — sem persistência): as duas preferências são estado
// compartilhado com o shell (`useSidebarExpandida` e `useSessoesAbertas`) — valem
// também para o AppSidebar/layout admin, que reagem em tempo real.
const { expandida: sidebarExpandida, marcarPreferenciaManual } = useSidebarExpandida()
const { abertas: sessoesAbertas } = useSessoesAbertas()

const iconeDaSessao: Record<string, Component> = {
  'Publicações': BookOpen,
  'Movimentos': ArrowLeftRight,
  'Cadastros': Boxes,
  'Administração': Settings
}

// Mesmo fallback do AppSidebar (`sessoesAbertas[label] ?? sessao.aberto`): se a chave
// faltar no estado em memória (ex.: edição do navigation.ts sem reload), card e
// sidebar concordam sobre o estado da sessão.
const estaAberta = (label: string) =>
  sessoesAbertas.value[label] ??
  sessoes.find((sessao) => sessao.label === label)?.aberto ??
  false

const itensDaSessao = (label: string) =>
  sessoes
    .find((sessao) => sessao.label === label)
    ?.items.map((item) => item.label)
    .join(' · ') ?? ''

const todasAbertas = computed(() => sessoes.every((sessao) => estaAberta(sessao.label)))
const todasRecolhidas = computed(() => sessoes.every((sessao) => !estaAberta(sessao.label)))

const definirTodas = (valor: boolean) => {
  for (const sessao of sessoes) sessoesAbertas.value[sessao.label] = valor
}

const definirSessao = (label: string, valor: boolean) => {
  sessoesAbertas.value[label] = valor
}

watch(sidebarExpandida, () => emit('change'))
watch(sessoesAbertas, () => emit('change'), { deep: true })
</script>

<template>
  <div>
    <!-- Cabeçalho do painel: ícone + título (mesmo padrão da aba Segurança) -->
    <div class="flex items-center gap-2.5">
      <PanelLeft class="h-5 w-5 shrink-0 text-brand-structure" aria-hidden="true" />
      <h2 class="text-base font-bold text-slate-900 tracking-tight">
        Preferências Iniciais da Barra Lateral (Sidebar) &amp; Sessões do Menu
      </h2>
    </div>
    <p class="text-xs text-slate-500 mt-0.5">
      Defina se a sidebar inicia expandida ou recolhida para novos acessos e quais
      sessões do menu iniciam abertas — todas, nenhuma ou sessão a sessão.
    </p>

    <div class="border-b border-slate-100 mt-4 mb-5"></div>

    <!-- Containers em coluna única; o conteúdo de cada um em duas colunas -->
    <div class="space-y-5">
      <!-- Card: Comportamento da Barra Lateral -->
      <section class="rounded-xl border border-slate-200 p-5">
        <div class="flex items-center gap-2.5">
          <span
            class="rounded-lg bg-brand-structure/10 p-2 text-brand-structure shrink-0"
            aria-hidden="true"
          >
            <PanelLeft class="h-4 w-4" />
          </span>
          <h3 class="text-sm font-bold text-slate-900">
            Comportamento Padrão da Barra Lateral
          </h3>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <UiCheckCard
            title="Expandida por padrão (Recomendado para Telas Maiores)"
            description="Exibe o menu lateral completo com rótulos textuais de todos os módulos."
            badge="Recomendado"
            badge-variant="lime"
            :icon="PanelLeftOpen"
            checkbox-position="start"
            :model-value="sidebarExpandida"
            :class="sidebarExpandida ? '' : 'opacity-60'"
            @change="(v: boolean) => { if (v) { sidebarExpandida = true; marcarPreferenciaManual() } }"
          />
          <UiCheckCard
            title="Recolhida / Compacta por padrão"
            description="Inicia no condensado com ícones de navegação rápida e tooltips flutuantes."
            badge="Compacta"
            badge-variant="neutral"
            :icon="PanelLeftClose"
            checkbox-position="start"
            :model-value="!sidebarExpandida"
            :class="sidebarExpandida ? 'opacity-60' : ''"
            @change="(v: boolean) => { if (v) { sidebarExpandida = false; marcarPreferenciaManual() } }"
          />
        </div>
      </section>

      <!-- Card: Comportamento das Sessões do Menu -->
      <section class="rounded-xl border border-slate-200 p-5">
        <div class="flex items-center gap-2.5">
          <span
            class="rounded-lg bg-brand-structure/10 p-2 text-brand-structure shrink-0"
            aria-hidden="true"
          >
            <SlidersHorizontal class="h-4 w-4" />
          </span>
          <h3 class="text-sm font-bold text-slate-900">
            Comportamento das Sessões do Menu
          </h3>
        </div>

        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <!-- Coluna 1: presets globais -->
          <div class="space-y-3">
            <UiCheckCard
              title="Todas as Sessões Abertas / Expandidas"
              description="Todos os submódulos ficam imediatamente visíveis sem necessidade de clique."
              badge="Recomendado"
              badge-variant="lime"
              :icon="FolderOpen"
              checkbox-position="start"
              :model-value="todasAbertas"
              :class="todasAbertas ? '' : 'opacity-60'"
              @change="(v: boolean) => { if (v) definirTodas(true) }"
            />
            <UiCheckCard
              title="Todas as Sessões Recolhidas / Acordeão"
              description="Mantém o menu enxuto e abre as categorias conforme demanda do operador."
              badge="Acordeão"
              badge-variant="neutral"
              :icon="Folder"
              checkbox-position="start"
              :model-value="todasRecolhidas"
              :class="todasRecolhidas ? '' : 'opacity-60'"
              @change="(v: boolean) => { if (v) definirTodas(false) }"
            />
          </div>

          <!-- Coluna 2: escolha por sessão -->
          <div>
            <div class="space-y-3">
              <UiCheckCard
                v-for="sessao in sessoes"
                :key="sessao.label"
                :title="sessao.label"
                :description="itensDaSessao(sessao.label)"
                :badge="estaAberta(sessao.label) ? 'Aberta' : 'Recolhida'"
                :badge-variant="estaAberta(sessao.label) ? 'done' : 'neutral'"
                :icon="iconeDaSessao[sessao.label] ?? Folder"
                checkbox-position="start"
                :model-value="estaAberta(sessao.label)"
                :class="estaAberta(sessao.label) ? '' : 'opacity-60'"
                @change="(v: boolean) => definirSessao(sessao.label, v)"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
