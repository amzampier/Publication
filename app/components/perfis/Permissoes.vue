<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { KeyRound, Info, ClipboardCopy, ClipboardPaste } from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { sessoes, type SidebarItem } from '../../config/navigation'
import {
  usePerfisDemo,
  MODULOS,
  ACOES,
  EXTRAS,
  PERMISSOES_POR_PERFIL,
  clonarMatriz,
  contarPermissoes,
  salvarPermissoes,
  type PerfilDemo,
  type ModuloId,
  type Permissao,
  type Acao
} from './usePerfisDemo'

interface Props {
  modelValue: boolean
  perfil: PerfilDemo | null
}

const props = withDefaults(defineProps<Props>(), {
  perfil: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()
const { perfis } = usePerfisDemo()

// Colunas editáveis: só as 4 ações fixas (docs/02 §3.5). As 5 extras aparecem como
// JSON de permissoes_extras — sem interruptor nesta etapa (edição ficará para a
// arquitetura futura da tela — decisão do usuário).
const acoesFixas: Acao[] = [...ACOES]

// Identidade visual dos módulos: fonte única = config/navigation (rótulos idênticos
// aos de MODULOS — ícone, cor da sidebar e sessão de agrupamento).
const IDENTIDADE = new Map<string, Pick<SidebarItem, 'icon' | 'cor'> & { sessao: string }>(
  sessoes.flatMap((sessao) =>
    sessao.items.map((item) => [item.label, { icon: item.icon, cor: item.cor, sessao: sessao.label }])
  )
)
const identidade = (label: string) => IDENTIDADE.get(label)

// Abas por sessão da sidebar (fonte única: config/navigation) — os 11 módulos são
// repartidos nas 4 sessões; cada aba filtra a tabela sem mexer no contador global.
const SESSOES = sessoes
  .map((sessao) => ({
    id: sessao.label,
    label: sessao.label,
    total: sessao.items.filter((item) => MODULOS.some((m) => m.label === item.label)).length
  }))
  .filter((sessao) => sessao.total > 0)

const TABS = SESSOES.map((sessao) => ({ id: sessao.id, label: sessao.label }))
const aba = ref(SESSOES[0]?.id ?? '')

// Rascunho: cópia da matriz do perfil — nada altera a base antes de Salvar.
const rascunho = ref<Record<ModuloId, Permissao[]>>({})

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto && props.perfil) {
      const perfil = props.perfil
      rascunho.value = clonarMatriz(perfil.permissoes)
      aba.value = SESSOES[0]?.id ?? ''
    }
  },
  { immediate: true }
)

// Contador "n/99": 99 = todas as ações (fixas + extras) — docs/07 §7.
const total = computed(
  () => MODULOS.reduce((soma, m) => soma + (rascunho.value[m.id]?.length ?? 0), 0)
)

const varianteTotal = computed(() =>
  total.value >= PERMISSOES_POR_PERFIL
    ? 'done'
    : total.value === 0
      ? 'neutral'
      : 'pending'
)

const tem = (modulo: ModuloId, acao: Permissao) =>
  rascunho.value[modulo]?.includes(acao) ?? false

const alternar = (modulo: ModuloId, acao: Permissao) => {
  const atual = rascunho.value[modulo] ?? []
  rascunho.value = {
    ...rascunho.value,
    [modulo]: atual.includes(acao) ? atual.filter((a) => a !== acao) : [...atual, acao]
  }
}

// Rótulo das pílulas de funcionalidade (ex.: "publicar" → "Publicar")
const rotuloExtra = (extra: Permissao) => extra.charAt(0).toUpperCase() + extra.slice(1)

// Módulos da aba ativa (sessão corrente) — o contador "n/99" continua global.
const modulosDaAba = computed(() =>
  MODULOS.filter((m) => identidade(m.label)?.sessao === aba.value)
)

const salvar = () => {
  if (!props.perfil) return
  perfis.value = salvarPermissoes(perfis.value, props.perfil.id, rascunho.value).base
  toast.success('Perfis de Acesso (RBAC)', 'Permissões do perfil atualizadas com sucesso.')
  emit('update:modelValue', false)
}

const cancelar = () => emit('update:modelValue', false)

// Cópia entre perfis (ações do rodapé — design D2/D3): "de" substitui o rascunho (vale
// após Salvar); "para" grava imediatamente a matriz SALVA do perfil corrente no alvo.
const copia = ref<'de' | 'para' | null>(null)
const perfilCopia = ref('')

const candidatos = computed(() =>
  props.perfil ? perfis.value.filter((p) => p.id !== props.perfil!.id) : []
)

const abrirCopia = (direcao: 'de' | 'para', e: MouseEvent) => {
  ;(e.currentTarget as HTMLElement).focus()
  perfilCopia.value = ''
  copia.value = direcao
}

const cancelarCopia = () => {
  copia.value = null
  perfilCopia.value = ''
}

const confirmarCopia = () => {
  const alvo = perfis.value.find((p) => p.id === perfilCopia.value)
  if (!alvo || !copia.value || !props.perfil) return
  if (copia.value === 'de') {
    rascunho.value = clonarMatriz(alvo.permissoes)
    toast.info('Perfis de Acesso (RBAC)', `Matriz de ${alvo.nome} copiada — vale após "Salvar".`)
  } else {
    const origem = perfis.value.find((p) => p.id === props.perfil!.id)
    if (!origem) return
    const antes = contarPermissoes(alvo)
    perfis.value = salvarPermissoes(perfis.value, alvo.id, origem.permissoes).base
    toast.success(
      'Perfis de Acesso (RBAC)',
      `Matriz de ${origem.nome} copiada para ${alvo.nome} (substituiu ${antes}/${PERMISSOES_POR_PERFIL}).`
    )
  }
  cancelarCopia()
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    title="Permissões"
    :subtitle="
      perfil
        ? `${perfil.nome} · matriz de ${MODULOS.length} módulos (${PERMISSOES_POR_PERFIL} permissões)`
        : ''
    "
    :icon="KeyRound"
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Matriz de permissões" :icon="KeyRound" class="[&>div.grid]:gap-y-[11px]">
      <!-- Legenda + contador global do rascunho -->
      <div class="flex items-start justify-between gap-3">
        <p class="flex items-start gap-1.5 text-[11px] text-slate-500">
          <Info class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
          <span>
            Interruptores nas 4 ações fixas; os chips de Funcionalidades ligam as ações
            extras. Nada vale até "Salvar".
          </span>
        </p>
        <div class="flex items-center gap-2 shrink-0" aria-live="polite">
          <span class="text-[11px] text-slate-500">Permissões</span>
          <UiBadge :variant="varianteTotal" class="font-mono tabular-nums">
            {{ total }}/{{ PERMISSOES_POR_PERFIL }}
          </UiBadge>
        </div>
      </div>

      <!-- Abas por sessão da sidebar (UiTabs do kit) -->
      <UiTabs
        v-model="aba"
        id-prefix="permissoes"
        :items="TABS"
        aria-label="Sessões de módulos"
      />

      <!-- Tabela-cartão da aba ativa: cabeçalho em slate-50, 1ª coluna fixa no scroll -->
      <div
        :id="`permissoes-panel-${aba}`"
        role="tabpanel"
        :aria-labelledby="`permissoes-tab-${aba}`"
        class="rounded-xl border border-slate-200 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[700px] border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2.5 min-w-[240px]">
                  <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Módulo
                  </span>
                </th>
                <th
                  v-for="acao in acoesFixas"
                  :key="acao"
                  class="px-2 py-2.5 text-center min-w-[68px]"
                >
                  <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {{ acao }}
                  </span>
                </th>
                <th class="px-3 py-2.5 text-left min-w-[230px]">
                  <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Funcionalidades
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="modulo in modulosDaAba"
                :key="modulo.id"
                class="group border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors"
              >
                <th
                  scope="row"
                  class="sticky left-0 z-10 bg-white group-hover:bg-slate-50/70 text-left font-normal px-3 py-2.5 transition-colors"
                >
                  <div class="flex items-center gap-2.5">
                    <span
                      class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      :style="{
                        backgroundColor: `${identidade(modulo.label)?.cor ?? '#64748b'}1a`,
                        color: identidade(modulo.label)?.cor ?? '#64748b'
                      }"
                    >
                      <component
                        :is="identidade(modulo.label)?.icon"
                        v-if="identidade(modulo.label)?.icon"
                        class="h-4 w-4"
                        aria-hidden="true"
                      />
                    </span>
                    <div class="min-w-0">
                      <span class="block text-xs font-semibold text-slate-800 whitespace-nowrap">
                        {{ modulo.label }}
                      </span>
                      <span class="block text-[11px] font-normal text-slate-500 truncate max-w-[220px]">
                        {{ modulo.descricao }}
                      </span>
                    </div>
                  </div>
                </th>
                <td
                  v-for="acao in acoesFixas"
                  :key="acao"
                  class="text-center px-2 py-2.5"
                >
                  <div class="flex justify-center">
                    <UiSwitch
                      :model-value="tem(modulo.id, acao)"
                      :aria-label="`${modulo.label}: ${acao}`"
                      @update:model-value="alternar(modulo.id, acao)"
                    />
                  </div>
                </td>
                <td class="px-3 py-2.5">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <UiCheckChip
                      v-for="extra in EXTRAS"
                      :key="extra"
                      size="sm"
                      :label="rotuloExtra(extra)"
                      :model-value="tem(modulo.id, extra)"
                      :aria-label="`${modulo.label}: ${extra}`"
                      @update:model-value="alternar(modulo.id, extra)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </UiModalSection>

    <template #footer>
      <div class="flex items-center gap-1.5 mr-auto">
        <UiTooltip content="Copiar de outro perfil — vale após Salvar" position="top">
          <button
            type="button"
            aria-label="Copiar permissões de outro perfil"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 hover:text-brand-focus hover:bg-lime-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="abrirCopia('de', $event)"
          >
            <ClipboardPaste class="h-4 w-4" aria-hidden="true" />
          </button>
        </UiTooltip>
        <UiTooltip content="Copiar para outro perfil — grava imediatamente" position="top">
          <button
            type="button"
            aria-label="Copiar permissões para outro perfil"
            class="inline-flex items-center justify-center rounded p-1.5 text-slate-500 hover:text-brand-focus hover:bg-lime-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="abrirCopia('para', $event)"
          >
            <ClipboardCopy class="h-4 w-4" aria-hidden="true" />
          </button>
        </UiTooltip>
      </div>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" @click="salvar">Salvar</UiButton>
    </template>
  </UiModal>

  <!-- Modal filho: seletor de perfil da cópia (pilha do kit — Esc/Tab/foco só no topo) -->
  <UiModal
    :model-value="copia !== null"
    title="Copiar permissões"
    :subtitle="
      copia === 'para'
        ? 'Destino — grava já a matriz salva; Cancelar não desfaz'
        : 'Origem — substitui o rascunho; só vale após Salvar'
    "
    :icon="copia === 'para' ? ClipboardCopy : ClipboardPaste"
    size="sm"
    @update:model-value="cancelarCopia"
  >
    <UiModalSection
      :title="copia === 'para' ? 'Escolha o perfil de destino' : 'Escolha o perfil de origem'"
      :icon="copia === 'para' ? ClipboardCopy : ClipboardPaste"
    >
      <div
        v-if="candidatos.length"
        role="radiogroup"
        :aria-label="copia === 'para' ? 'Perfis de destino' : 'Perfis de origem'"
        class="grid gap-2"
      >
        <UiChoiceCard
          v-for="candidato in candidatos"
          :key="candidato.id"
          :value="candidato.id"
          :title="candidato.nome"
          :description="candidato.descricao"
          :badge="`${contarPermissoes(candidato)}/${PERMISSOES_POR_PERFIL}`"
          badge-variant="neutral"
          badge-mono
          :model-value="perfilCopia"
          @update:model-value="perfilCopia = $event"
        />
      </div>
      <p v-else class="text-xs text-slate-500">
        Nenhum outro perfil disponível para cópia.
      </p>
    </UiModalSection>
    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelarCopia">Cancelar</UiButton>
      <UiButton variant="primary" size="md" :disabled="!perfilCopia" @click="confirmarCopia">
        Copiar
      </UiButton>
    </template>
  </UiModal>
</template>
