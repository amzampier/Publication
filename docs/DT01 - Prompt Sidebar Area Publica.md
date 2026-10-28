# Prompt de Engenharia de Software: Replicação Fiel do Menu Sidebar da Área Pública em Vue 3 + Nuxt 3

> **Finalidade do Documento:**  
> Este documento técnico contém o prompt arquitetural e a especificação completa de código para replicar **com 100% de paridade visual, funcional e hierárquica** o menu sidebar lateral esquerdo da área pública em uma aplicação desenvolvida com **Vue 3** e **Nuxt 3**.

---

## 1. Contexto e Diretrizes Arquiteturais

Você deve implementar o componente `<PublicSidebar />` para um portal corporativo de releases, manuais e governança técnica. O projeto utiliza:
- **Framework:** Nuxt 3 (SSR / Universal / SPA)
- **Linguagem:** TypeScript estrito com Vue 3 `<script setup lang="ts">`
- **Estilização:** Tailwind CSS v3 ou v4
- **Ícones:** `lucide-vue-next` (ou `@nuxt/icon`)

A barra lateral é posicionada à esquerda com largura fixa de `w-72` (18rem / 288px), fundo branco, borda sutil `border-r border-slate-200/90`, fixada no topo com `sticky top-16` e altura `h-[calc(100vh-4rem)]`, rolagem suave com `overflow-y-auto` e proteção de seleção de texto `select-none`.

---

## 2. Estrutura Hierárquica Obrigatória do Menu

O sidebar possui exatamente 4 blocos de navegação:

### Bloco 0: Atalho Superior (Painel Geral)
- Botão para retornar ao painel principal: **"Painel de Destaques & Busca"** (ícone `Home`).
- Fica destacado com fundo `bg-indigo-600 text-white shadow-sm shadow-indigo-600/30` quando a visualização ativa for `'home'`.

### Seção 1: Releases Week (Ícone `Calendar` Indigo)
- **Agrupamento (3 Níveis):** Ano (ex: `2026`, `2025`) $\rightarrow$ Mês (ex: `Setembro`, `Agosto`) $\rightarrow$ Releases da Semana.
- **Header da Seção:** Título em caixa alta `text-xs font-bold uppercase tracking-wider text-slate-800`, chevron de expansão e badge com a quantidade de releases publicadas.
- **Nível 1 (Ano):** Botão com ano em fonte mono (`2026`), chevron e linha guia vertical `border-l-2 border-slate-200`.
- **Nível 2 (Mês):** Botão com nome do mês, badge com total de releases e chevron.
- **Nível 3 (Release Week):** Card do item com:
  - Título da semana: `Semana {rel.semana}`
  - Badge de versão em fonte mono: `v{rel.versao}` (`bg-indigo-100 text-indigo-800 font-semibold`)
  - Badge opcional `NOVA` em âmbar caso `rel.destaqueSemana` seja verdadeiro.
  - Subtítulo com quantidade de chamadas e código da release (`{rel.itens.length} chamadas · Rel: {rel.release}`).
  - **Comportamento ao Clicar:** Ao clicar no card da Release Week, aciona a exibição **na página principal** das chamadas que foram arrumadas (correções/melhorias) ou criadas novas funcionalidades, emitindo `select-release(rel.id)`.

### Seção 2: Manuais Mensais (Ícone `BookOpen` Esmeralda)
- **Agrupamento (2 Níveis Apenas):** Ano (ex: `2026`, `2025`) $\rightarrow$ Mês (ex: `Setembro`, `Agosto`).
- **Regra Crucial:** **NÃO trazer os manuais individuais aninhados na sidebar**; os manuais e procedimentos são mostrados diretamente na página!
- **Comportamento Solicitado:**
  1. Ao clicar em **Manuais Mensais**, abre os **Anos** cadastrados.
  2. Ao clicar no **Ano**, expande os **Meses** daquele ano.
  3. **Ao clicar no Mês:** Aciona a exibição dos manuais daquele mês na página principal (emite `select-manual-month({ ano, mes })`), e destaca o mês selecionado com `bg-emerald-100 text-emerald-950 font-bold border-emerald-400`. Exibe um badge com a contagem de manuais (`{manList.length} manual(is)`).

### Seção 3: Escopo de Projetos (Ícone `FolderGit2` Púrpura)
- **Hierarquia (2 Níveis Apenas):** Versão do Projeto $\rightarrow$ Sistemas Contemplados.
- **Regra Crucial:** **NÃO trazer as chamadas contempladas aninhadas na sidebar**; ao clicar no sistema, as chamadas contempladas daquele sistema são mostradas diretamente na página!
- **Comportamento Solicitado:**
  1. Lista os projetos anuais por versão (ex: `v2026.1 - Ano 2026`).
  2. Exibe o cabeçalho do projeto com botão de expansão, versão (`v2026.1`), ano, nome completo do projeto, contador de sistemas (`{sistemas.length} sistemas`) e chamadas (`{sc.itens.length} chamadas`), além de um botão de ação rápida **"Ver Tudo"** que emite `select-scope(sc.id)`.
  3. **Sob o projeto (Nível 2):** Lista os **Sistemas Contemplados** (ERP, Retaguarda, PDV, WMS, etc.) com ícone de monitor `Monitor`, nome do sistema e badge com a quantidade de chamadas daquele sistema.
  4. **Ao clicar no Sistema:** Destaca o sistema selecionado e emite `select-scope(sc.id, sw)` para exibir **na página principal as chamadas contempladas** daquele sistema (com badges de impacto, situação, screenshots e vídeos).

---

## 3. Interfaces TypeScript Requeridas (`types/index.ts`)

```typescript
export type ItemType = 'Correção' | 'Melhoria' | 'Nova Funcionalidade';
export type ImpactoNivel = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
export type ScopeItemSituacao = 'Backlog' | 'Desenvolvimento' | 'Homologação' | 'Implantado';

export interface EntregaItem {
  id: string;
  origem?: 'Release' | 'Escopo' | 'Manual';
  chamada?: string;
  numeroChamado?: string;
  titulo: string;
  software: string;
  modulo?: string;
  categoria?: string;
  tipo?: ItemType;
  impacto?: ImpactoNivel;
  situacao?: ScopeItemSituacao;
  descricaoCompleta: string;
  linkManual?: string;
  linkVideo?: string;
  imagens: string[];
  status?: string;
  tags?: string[];
  parceiro?: string;
}

export interface ReleaseWeek {
  id: string;
  nome: string;
  versao?: string;
  release?: string;
  semana: number;
  ano: number;
  mes: string;
  status: 'Rascunho' | 'Em Revisão' | 'Alterações Solicitadas' | 'Aprovado' | 'Publicado';
  descricao: string;
  itens: EntregaItem[];
  viewsCount: number;
  destaqueSemana?: boolean;
}

export interface Manual {
  id: string;
  titulo: string;
  mes: string;
  ano: number;
  status: 'Publicado' | 'Rascunho' | 'Em Revisão' | 'Aprovado';
  software?: string;
  categoria?: string;
  descricaoCompleta?: string;
  itens: EntregaItem[];
  viewsCount: number;
}

export interface ProjectScopeItem extends EntregaItem {
  numeroChamado: string;
  situacao: ScopeItemSituacao;
}

export interface ProjectScope {
  id: string;
  nome: string;
  versao: string;
  ano: number;
  dataInicio: string;
  dataFinal: string;
  status: 'Planejamento' | 'Em Andamento' | 'Homologação' | 'Concluído' | 'Publicado';
  softwaresContemplados: string[];
  descricaoGeral: string;
  itens: ProjectScopeItem[];
  viewsCount: number;
}
```

---

## 4. Implementação Completa do Componente em Nuxt 3 (`components/PublicSidebar.vue`)

Copie e salve este arquivo em `components/PublicSidebar.vue`:

```vue
<template>
  <aside
    class="w-72 bg-white border-r border-slate-200/90 flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0 overflow-hidden"
  >
    <div class="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
      <!-- 0. Atalho Home / Painel Geral -->
      <div>
        <button
          type="button"
          @click="$emit('go-home')"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          :class="[
            activeView === 'home' && !selectedManualMonth
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          ]"
        >
          <Home class="w-4 h-4 shrink-0" />
          <span>Painel de Destaques & Busca</span>
        </button>
      </div>

      <!-- 1. SEÇÃO RELEASES WEEK (Ano -> Mês -> Releases) -->
      <div>
        <div class="flex items-center justify-between mb-2 px-1">
          <button
            type="button"
            @click="openReleases = !openReleases"
            class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Calendar class="w-3.5 h-3.5 text-indigo-600" />
            <span>Releases Week</span>
            <ChevronDown v-if="openReleases" class="w-3.5 h-3.5 text-slate-400" />
            <ChevronRight v-else class="w-3.5 h-3.5 text-slate-400" />
          </button>
          <span class="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {{ publishedReleases.length }}
          </span>
        </div>

        <div v-if="openReleases" class="space-y-1 pl-1">
          <div
            v-for="year in releaseYears"
            :key="year"
            class="border-l-2 border-slate-200 pl-2 my-1"
          >
            <button
              type="button"
              @click="toggleReleaseYear(year)"
              class="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer"
            >
              <span class="font-mono">{{ year }}</span>
              <ChevronDown v-if="expandedReleaseYears[year]" class="w-3 h-3 text-slate-400" />
              <ChevronRight v-else class="w-3 h-3 text-slate-400" />
            </button>

            <!-- Meses da Release -->
            <div v-if="expandedReleaseYears[year]" class="space-y-1.5 pl-2 pt-1">
              <div
                v-for="month in Object.keys(releasesByYearMonth[year] || {})"
                :key="month"
                class="space-y-1"
              >
                <button
                  type="button"
                  @click="toggleReleaseMonth(`${year}-${month}`)"
                  class="w-full flex items-center justify-between py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span class="truncate">{{ month }}</span>
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-slate-400">
                      {{ (releasesByYearMonth[year]?.[month] || []).length }}
                    </span>
                    <ChevronDown v-if="expandedReleaseMonths[`${year}-${month}`]" class="w-2.5 h-2.5 text-slate-400" />
                    <ChevronRight v-else class="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </button>

                <!-- Lista de Releases do Mês -->
                <div v-if="expandedReleaseMonths[`${year}-${month}`]" class="space-y-0.5 pl-2">
                  <button
                    v-for="rel in releasesByYearMonth[year]?.[month] || []"
                    :key="rel.id"
                    type="button"
                    @click="$emit('select-release', rel.id)"
                    class="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex flex-col"
                    :class="[
                      activeView === 'release' && selectedReleaseId === rel.id
                        ? 'bg-indigo-50 text-indigo-900 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    ]"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1 min-w-0">
                        <span class="truncate">Semana {{ rel.semana }}</span>
                        <span
                          v-if="rel.versao"
                          class="font-mono text-[9px] bg-indigo-100 text-indigo-800 px-1 rounded font-semibold shrink-0"
                        >
                          v{{ rel.versao }}
                        </span>
                      </div>
                      <span
                        v-if="rel.destaqueSemana"
                        class="text-[9px] text-amber-600 font-semibold uppercase shrink-0"
                      >
                        Nova
                      </span>
                    </div>
                    <span class="text-[10px] text-slate-400 truncate">
                      {{ rel.itens.length }} itens {{ rel.release ? `· Rel: ${rel.release}` : '' }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. SEÇÃO MANUAIS MENSAIS (Nível 1: Ano -> Nível 2: Mês apenas, manuais na página) -->
      <div>
        <div class="flex items-center justify-between mb-2 px-1">
          <button
            type="button"
            @click="openManuals = !openManuals"
            class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <BookOpen class="w-3.5 h-3.5 text-emerald-600" />
            <span>Manuais Mensais</span>
            <ChevronDown v-if="openManuals" class="w-3.5 h-3.5 text-slate-400" />
            <ChevronRight v-else class="w-3.5 h-3.5 text-slate-400" />
          </button>
          <span class="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {{ publishedManuals.length }}
          </span>
        </div>

        <div v-if="openManuals" class="space-y-1 pl-1">
          <div
            v-for="year in manualYears"
            :key="year"
            class="border-l-2 border-emerald-200 pl-2 my-1"
          >
            <!-- Nível 1: Ano -->
            <button
              type="button"
              @click="toggleManualYear(year)"
              class="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 cursor-pointer"
              :title="`Expandir meses de ${year}`"
            >
              <div class="flex items-center gap-1.5">
                <span class="font-mono">{{ year }}</span>
                <span class="text-[10px] text-slate-400 font-normal">
                  ({{ Object.keys(manualsByYearMonth[year] || {}).length }} meses)
                </span>
              </div>
              <ChevronDown v-if="expandedManualYears[year]" class="w-3 h-3 text-slate-400" />
              <ChevronRight v-else class="w-3 h-3 text-slate-400" />
            </button>

            <!-- Nível 2: Mês (ao clicar no mês mostra os manuais na página) -->
            <div v-if="expandedManualYears[year]" class="space-y-1 pl-2 pt-1">
              <button
                v-for="month in Object.keys(manualsByYearMonth[year] || {})"
                :key="month"
                type="button"
                @click="handleSelectMonth(year, month)"
                class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer border"
                :class="[
                  isMonthSelected(year, month)
                    ? 'bg-emerald-100 text-emerald-950 font-bold border-emerald-400 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-white hover:bg-emerald-50/70 text-slate-700 border-slate-200/80 hover:text-slate-900'
                ]"
                :title="`Ver os manuais de ${month}/${year} na página`"
              >
                <div class="flex items-center gap-1.5 min-w-0">
                  <BookOpen
                    class="w-3.5 h-3.5 shrink-0"
                    :class="isMonthSelected(year, month) ? 'text-emerald-700' : 'text-emerald-600'"
                  />
                  <span class="truncate font-medium">{{ month }}</span>
                </div>

                <span
                  class="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold"
                  :class="[
                    isMonthSelected(year, month)
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  ]"
                >
                  {{ (manualsByYearMonth[year]?.[month] || []).length }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. SEÇÃO ESCOPO DE PROJETOS (Nível 1: Versão -> Nível 2: Sistemas apenas, chamadas na página) -->
      <div>
        <div class="flex items-center justify-between mb-2 px-1">
          <button
            type="button"
            @click="openScopes = !openScopes"
            class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-purple-700 transition-colors cursor-pointer"
          >
            <FolderGit2 class="w-3.5 h-3.5 text-purple-600" />
            <span>Escopo de Projetos</span>
            <ChevronDown v-if="openScopes" class="w-3.5 h-3.5 text-slate-400" />
            <ChevronRight v-else class="w-3.5 h-3.5 text-slate-400" />
          </button>
          <span class="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {{ scopes.length }}
          </span>
        </div>

        <div v-if="openScopes" class="space-y-2.5 pl-1">
          <div
            v-for="(sc, index) in scopes"
            :key="sc.id"
            class="rounded-2xl border transition-all overflow-hidden"
            :class="[
              activeView === 'scope' && selectedScopeId === sc.id
                ? 'border-purple-300 bg-purple-50/20 shadow-xs'
                : 'border-slate-200/90 bg-white hover:border-slate-300'
            ]"
          >
            <!-- Nível 1: Versão do Projeto -->
            <div class="p-2.5">
              <div class="flex items-center justify-between gap-1 mb-1">
                <button
                  type="button"
                  @click="toggleProject(sc.id)"
                  class="flex items-center gap-1.5 min-w-0 text-left cursor-pointer group flex-1"
                >
                  <span class="text-purple-600 transition-transform">
                    <ChevronDown v-if="isProjectExpanded(sc.id, index)" class="w-3.5 h-3.5" />
                    <ChevronRight v-else class="w-3.5 h-3.5" />
                  </span>
                  <span class="font-mono font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                    {{ sc.versao }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-medium shrink-0">
                    Ano {{ sc.ano }}
                  </span>
                </button>

                <button
                  type="button"
                  @click="$emit('select-scope', sc.id)"
                  class="text-[10px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200 transition-all cursor-pointer shrink-0"
                  title="Mostrar todas as chamadas deste projeto na página"
                >
                  Ver Tudo
                </button>
              </div>

              <button
                type="button"
                @click="toggleProject(sc.id)"
                class="text-left w-full cursor-pointer group"
              >
                <p class="font-semibold text-slate-800 text-xs line-clamp-1 group-hover:text-purple-900 leading-snug">
                  {{ sc.nome }}
                </p>
              </button>

              <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                <span class="flex items-center gap-1">
                  <Monitor class="w-3 h-3 text-purple-500" />
                  <strong class="text-slate-700">{{ getProjectSystems(sc).length }}</strong> sistemas
                </span>
                <span>
                  <strong class="text-slate-700">{{ sc.itens.length }}</strong> chamadas
                </span>
              </div>
            </div>

            <!-- Nível 2: Sistemas (ao clicar no sistema mostra as chamadas contempladas na página) -->
            <div
              v-if="isProjectExpanded(sc.id, index)"
              class="bg-slate-50/80 border-t border-slate-200/90 p-2 space-y-1"
            >
              <div class="px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-0.5">
                Sistemas Contemplados:
              </div>

              <button
                v-for="sw in getProjectSystems(sc)"
                :key="sw"
                type="button"
                @click="handleSelectSystem(sc.id, sw)"
                class="w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer border"
                :class="[
                  isSystemActive(sc.id, sw)
                    ? 'bg-purple-100 text-purple-950 font-bold border-purple-400 shadow-xs ring-1 ring-purple-500/30'
                    : 'bg-white hover:bg-purple-50/70 text-slate-700 border-slate-200/80 hover:text-slate-900'
                ]"
                :title="`Ver chamadas contempladas do sistema ${sw} na página`"
              >
                <div class="flex items-center gap-1.5 min-w-0">
                  <Monitor
                    class="w-3.5 h-3.5 shrink-0"
                    :class="isSystemActive(sc.id, sw) ? 'text-purple-700' : 'text-purple-500'"
                  />
                  <span class="truncate font-medium text-xs">{{ sw }}</span>
                </div>

                <span
                  class="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0"
                  :class="[
                    isSystemActive(sc.id, sw)
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  ]"
                >
                  {{ getSystemTickets(sc, sw).length }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Calendar,
  BookOpen,
  FolderGit2,
  ChevronDown,
  ChevronRight,
  Home,
  Monitor
} from 'lucide-react-vue-next';
import type { ReleaseWeek, Manual, ProjectScope, ImpactoNivel } from '~/types';

// Props
const props = defineProps<{
  releases: ReleaseWeek[];
  scopes: ProjectScope[];
  manuals: Manual[];
  selectedReleaseId: string | null;
  selectedScopeId: string | null;
  selectedScopeSoftware?: string | null;
  selectedManualId: string | null;
  selectedManualMonth?: { ano: number; mes: string } | null;
  activeView: 'home' | 'release' | 'scope' | 'manual';
  softwares: string[];
}>();

// Emits
const emit = defineEmits<{
  (e: 'select-release', id: string): void;
  (e: 'select-scope', id: string, software?: string, ticketId?: string): void;
  (e: 'select-manual', id: string): void;
  (e: 'select-manual-month', payload: { ano: number; mes: string }): void;
  (e: 'go-home'): void;
}>();

// Estados de abertura das 3 seções principais
const openReleases = ref(true);
const openManuals = ref(true);
const openScopes = ref(true);

// -----------------------------------------------------------------------------
// 1. LÓGICA DE RELEASES
// -----------------------------------------------------------------------------
const expandedReleaseYears = ref<Record<number, boolean>>({ 2026: true, 2025: false });
const expandedReleaseMonths = ref<Record<string, boolean>>({ '2026-Setembro': true });

const publishedReleases = computed(() =>
  props.releases.filter((r) => r.status === 'Publicado')
);

const releasesByYearMonth = computed(() => {
  return publishedReleases.value.reduce((acc, rel) => {
    const yr = rel.ano;
    const mo = rel.mes;
    if (!acc[yr]) acc[yr] = {};
    if (!acc[yr][mo]) acc[yr][mo] = [];
    acc[yr][mo].push(rel);
    return acc;
  }, {} as Record<number, Record<string, ReleaseWeek[]>>);
});

const releaseYears = computed(() =>
  Object.keys(releasesByYearMonth.value)
    .map(Number)
    .sort((a, b) => b - a)
);

const toggleReleaseYear = (year: number) => {
  expandedReleaseYears.value[year] = !expandedReleaseYears.value[year];
};

const toggleReleaseMonth = (key: string) => {
  expandedReleaseMonths.value[key] = !expandedReleaseMonths.value[key];
};

// -----------------------------------------------------------------------------
// 2. LÓGICA DE MANUAIS MENSAIS (2 Níveis: Ano -> Mês)
// -----------------------------------------------------------------------------
const expandedManualYears = ref<Record<number, boolean>>({ 2026: true, 2025: false });

const publishedManuals = computed(() =>
  props.manuals.filter((m) => m.status === 'Publicado')
);

const manualsByYearMonth = computed(() => {
  return publishedManuals.value.reduce((acc, man) => {
    const yr = man.ano;
    const mo = man.mes;
    if (!acc[yr]) acc[yr] = {};
    if (!acc[yr][mo]) acc[yr][mo] = [];
    acc[yr][mo].push(man);
    return acc;
  }, {} as Record<number, Record<string, Manual[]>>);
});

const manualYears = computed(() =>
  Object.keys(manualsByYearMonth.value)
    .map(Number)
    .sort((a, b) => b - a)
);

const toggleManualYear = (year: number) => {
  expandedManualYears.value[year] = !expandedManualYears.value[year];
};

const handleSelectMonth = (year: number, month: string) => {
  emit('select-manual-month', { ano: year, mes: month });
};

const isMonthSelected = (year: number, month: string) => {
  return (
    props.selectedManualMonth?.ano === year &&
    props.selectedManualMonth?.mes.toLowerCase() === month.toLowerCase()
  );
};

// -----------------------------------------------------------------------------
// 3. LÓGICA DE ESCOPO DE PROJETOS (2 Níveis: Versão -> Sistemas)
// -----------------------------------------------------------------------------
const expandedProjects = ref<Record<string, boolean>>({ 'escopo-2026-1': true });

const isProjectExpanded = (projectId: string, index: number) => {
  if (expandedProjects.value[projectId] !== undefined) {
    return expandedProjects.value[projectId];
  }
  return index === 0 || props.selectedScopeId === projectId;
};

const toggleProject = (projectId: string) => {
  expandedProjects.value[projectId] = !isProjectExpanded(projectId, 0);
};

const getProjectSystems = (sc: ProjectScope): string[] => {
  const list = [
    ...(sc.softwaresContemplados || []),
    ...sc.itens.map((it) => it.software)
  ];
  return Array.from(new Set(list)).filter(Boolean);
};

const getSystemTickets = (sc: ProjectScope, sw: string) => {
  return sc.itens.filter(
    (it) => (it.software || '').toLowerCase() === sw.toLowerCase()
  );
};

const isSystemActive = (projectId: string, sw: string) => {
  return (
    props.selectedScopeId === projectId &&
    props.selectedScopeSoftware?.toLowerCase() === sw.toLowerCase()
  );
};

const handleSelectSystem = (projectId: string, sw: string) => {
  emit('select-scope', projectId, sw);
};

const getImpactBadgeClasses = (impacto?: ImpactoNivel) => {
  switch (impacto) {
    case 'Crítico':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'Alto':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'Médio':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'Baixo':
    default:
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  }
};
</script>

<style scoped>
/* Estilização suave para scrollbar interna */
.scrollbar-thin::-webkit-scrollbar {
  width: 5px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 9999px;
}
</style>
```

---

## 5. Exemplo de Integração na Página Principal Nuxt (`pages/index.vue`)

```vue
<template>
  <div class="flex min-h-screen bg-slate-50">
    <!-- Sidebar Replicado -->
    <PublicSidebar
      :releases="releases"
      :scopes="scopes"
      :manuals="manuals"
      :selected-release-id="selectedReleaseId"
      :selected-scope-id="selectedScopeId"
      :selected-scope-software="selectedScopeSoftware"
      :selected-manual-id="selectedManualId"
      :selected-manual-month="selectedManualMonth"
      :active-view="activeView"
      :softwares="['ERP Enterprise', 'PDV Touch', 'WMS Logística']"
      @select-release="onSelectRelease"
      @select-scope="onSelectScope"
      @select-manual="onSelectManual"
      @select-manual-month="onSelectManualMonth"
      @go-home="onGoHome"
    />

    <!-- Conteúdo Principal -->
    <main class="flex-1 p-8">
      <!-- 1. Se um Mês de Manual for selecionado na sidebar -->
      <section v-if="selectedManualMonth">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-slate-900">
            Manuais de {{ selectedManualMonth.mes }} / {{ selectedManualMonth.ano }}
          </h1>
          <button
            @click="selectedManualMonth = null"
            class="text-xs font-semibold text-emerald-700 underline"
          >
            Voltar aos destaques
          </button>
        </div>
        <!-- Cards dos manuais deste mês -->
      </section>

      <!-- 2. Visão Padrão de Destaques -->
      <section v-else>
        <h1 class="text-2xl font-bold text-slate-900 mb-4">Painel de Destaques</h1>
        <!-- Destaques da semana, releases e manuais -->
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ReleaseWeek, ProjectScope, Manual } from '~/types';

const selectedReleaseId = ref<string | null>(null);
const selectedScopeId = ref<string | null>(null);
const selectedScopeSoftware = ref<string | null>(null);
const selectedManualId = ref<string | null>(null);
const selectedManualMonth = ref<{ ano: number; mes: string } | null>(null);
const activeView = ref<'home' | 'release' | 'scope' | 'manual'>('home');

// Mocks ou useFetch()
const releases = ref<ReleaseWeek[]>([]);
const scopes = ref<ProjectScope[]>([]);
const manuals = ref<Manual[]>([]);

const onSelectRelease = (id: string) => {
  selectedReleaseId.value = id;
  activeView.value = 'release';
};

const onSelectScope = (id: string, software?: string, ticketId?: string) => {
  selectedScopeId.value = id;
  selectedScopeSoftware.value = software || null;
  activeView.value = 'scope';
};

const onSelectManual = (id: string) => {
  selectedManualId.value = id;
  activeView.value = 'manual';
};

const onSelectManualMonth = (payload: { ano: number; mes: string }) => {
  selectedManualMonth.value = payload;
  activeView.value = 'home';
};

const onGoHome = () => {
  selectedReleaseId.value = null;
  selectedScopeId.value = null;
  selectedScopeSoftware.value = null;
  selectedManualId.value = null;
  selectedManualMonth.value = null;
  activeView.value = 'home';
};
</script>
```
