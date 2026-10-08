<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ShieldCheck, Clock } from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import {
  usePerfisDemo,
  salvarPerfil,
  matrizVazia,
  type PerfilDemo,
  type ModoPerfis,
  type SituacaoPerfil
} from './usePerfisDemo'

interface Props {
  modelValue: boolean
  modo: ModoPerfis
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

/** Rascunho do modal: o registro completo do perfil (mesmo contrato do Formulario de usuários). */
const rascunhoVazio = (): PerfilDemo => ({
  id: '',
  nome: '',
  descricao: '',
  situacao: 'Ativo',
  criado_em: '',
  atualizado_em: '',
  permissoes: matrizVazia()
})

const rascunhoDoPerfil = (p: PerfilDemo): PerfilDemo => ({ ...p })

const rascunho = ref<PerfilDemo>(rascunhoVazio())
const erros = ref<Record<string, string>>({})

const ORDEM_FOCO = ['nome']

const validar = (r: PerfilDemo): Record<string, string> => {
  const e: Record<string, string> = {}

  if (!r.nome.trim()) e.nome = 'Informe o nome do perfil.'

  return e
}

const focarCampo = (campo: string) => {
  nextTick(() => {
    const wrapper = document.querySelector<HTMLElement>(`[data-campo="${campo}"]`)
    const alvo = wrapper?.querySelector<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), [role="combobox"], [role="radio"][tabindex="0"], [role="radio"]'
    )
    alvo?.focus()
  })
}

// --- Enter navega para o próximo campo (mesmo ordem do Tab) ---
// Foca o elemento real (<input>, gatilho do Select) — nunca o wrapper — e reposiciona
// a caret no fim. O <textarea> é ignorado (tagName !== 'INPUT'): Enter quebra linha.
const SELECTOR_FOCO =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

const aoEnter = (e: KeyboardEvent) => {
  const alvo = e.target as HTMLElement | null
  if (!alvo || alvo.tagName !== 'INPUT') return
  // Busca interna do UiSelect: Enter escolhe a opção destacada (kit)
  if (alvo.closest('[data-busca]')) return

  const raiz = e.currentTarget as HTMLElement
  const lista = Array.from(raiz.querySelectorAll<HTMLElement>(SELECTOR_FOCO)).filter(
    (el) => el.offsetParent !== null
  )
  const i = lista.indexOf(alvo)
  if (i === -1 || i === lista.length - 1) return

  e.preventDefault()
  const proximo = lista[i + 1]
  proximo.focus()
  if (proximo.tagName === 'INPUT') {
    const input = proximo as HTMLInputElement
    try {
      const fim = input.value.length
      input.setSelectionRange(fim, fim)
    } catch {
      // tipos sem suporte a selectionRange
    }
  }
}

const salvar = () => {
  erros.value = validar(rascunho.value)
  const primeiro = ORDEM_FOCO.find((campo) => erros.value[campo])
  if (primeiro) {
    focarCampo(primeiro)
    return
  }

  const instante = new Date().toISOString()
  const registro: PerfilDemo = {
    ...rascunho.value,
    // Criação: ambos os timestamps nascem agora. Edição: criado_em preservado do
    // registro (copiado no rascunho) e atualizado_em reflete o salvamento.
    criado_em: props.modo === 'novo' ? instante : rascunho.value.criado_em,
    atualizado_em: instante
  }
  const { base: novaBase } = salvarPerfil(perfis.value, registro, props.modo)
  perfis.value = novaBase

  toast.success(
    'Perfis de Acesso (RBAC)',
    props.modo === 'novo' ? 'Perfil criado com sucesso.' : 'Perfil atualizado com sucesso.'
  )
  emit('update:modelValue', false)
}

const cancelar = () => emit('update:modelValue', false)

// Abertura: rascunho novo ou cópia do registro
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      erros.value = {}
      rascunho.value =
        props.modo === 'editar' && props.perfil
          ? rascunhoDoPerfil(props.perfil)
          : rascunhoVazio()
    }
  },
  { immediate: true }
)

// Erros são persistentes mas acompanham o campo: some quando a regra volta a passar
watch(
  rascunho,
  () => {
    if (!Object.keys(erros.value).length) return
    const atuais = validar(rascunho.value)
    for (const campo of Object.keys(erros.value)) {
      if (atuais[campo]) erros.value[campo] = atuais[campo]
      else delete erros.value[campo]
    }
  },
  { deep: true }
)

const segmentosSituacao: { value: SituacaoPerfil; label: SituacaoPerfil; tone: 'emerald' | 'slate' | 'rose' }[] = [
  { value: 'Ativo', label: 'Ativo', tone: 'emerald' },
  { value: 'Inativo', label: 'Inativo', tone: 'slate' },
  { value: 'Bloqueado', label: 'Bloqueado', tone: 'rose' }
]

/** 'dd/mm/yyyy' — só a data, sem horário; null/vazio -> '-'. */
const formatarData = (iso: string | null): string => {
  if (!iso) return '-'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

const criadoTexto = () => formatarData(rascunho.value.criado_em || null)
const atualizadoTexto = () => formatarData(rascunho.value.atualizado_em || null)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="modo === 'novo' ? 'Novo Perfil' : 'Editar Perfil'"
    subtitle="Dados cadastrais do perfil de acesso"
    :icon="ShieldCheck"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-y-[11px]" @keydown.enter="aoEnter">
      <!-- 1. Dados do Perfil -->
      <UiModalSection
        title="Dados do Perfil"
        :icon="ShieldCheck"
        class="[&>div.grid]:gap-y-[11px]"
      >
        <!-- Nome + Situação na linha 1 e Descrição full-width: nenhum buraco no grid
             (mesmo critério do molde em usuarios/Formulario.vue — QA-UX UX-05) -->
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
          <UiInput
            v-model="rascunho.nome"
            data-campo="nome"
            class="sm:col-span-3"
            label="Nome"
            placeholder="Ex.: Super Administrador"
            :error="erros.nome"
          />
          <UiSegmented
            v-model="rascunho.situacao"
            data-campo="situacao"
            class="sm:col-span-3"
            label="Situação"
            :options="segmentosSituacao"
          />
          <UiTextarea
            v-model="rascunho.descricao"
            data-campo="descricao"
            class="sm:col-span-6"
            label="Descrição"
            placeholder="Detalhe as responsabilidades do perfil…"
            :rows="3"
          />
        </div>
      </UiModalSection>

      <!-- 2. Informações de Cadastro — somente na edição; a criação abre com a seção 1 -->
      <UiModalSection
        v-if="modo === 'editar'"
        title="Informações de Cadastro"
        :icon="Clock"
        class="[&>div.grid]:gap-y-[11px]"
      >
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
          <UiInput label="Data Cadastro" :model-value="criadoTexto()" disabled />
          <UiInput label="Data Alteração" :model-value="atualizadoTexto()" disabled />
        </div>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" @click="salvar">Salvar</UiButton>
    </template>
  </UiModal>
</template>
