<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Boxes, Clock } from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import {
  CATEGORIAS,
  SITUACOES,
  formatarDataHora,
  salvarSoftware,
  useSoftwaresModelo,
  type CategoriaSoftware,
  type ModoSoftwares,
  type SituacaoSoftware,
  type SoftwareModelo
} from './useSoftwaresModelo'

interface Props {
  modelValue: boolean
  modo: ModoSoftwares
  software: SoftwareModelo | null
}

const props = withDefaults(defineProps<Props>(), {
  software: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()
const { softwares } = useSoftwaresModelo()
const salvando = ref(false)

/** Rascunho do modal: o registro completo do software (mesmo contrato dos demais). */
const rascunhoVazio = (): SoftwareModelo => ({
  codigo: '',
  descricao: '',
  categoria: 'Delphi',
  situacao: 'Ativo',
  criado_em: '',
  atualizado_em: ''
})

const rascunho = ref<SoftwareModelo>(rascunhoVazio())
const erros = ref<Record<string, string>>({})

const ORDEM_FOCO = ['descricao']

const validar = (r: SoftwareModelo): Record<string, string> => {
  const e: Record<string, string> = {}
  const descricao = r.descricao.trim()
  if (!descricao) e.descricao = 'Informe a descrição do software.'
  else if (descricao.length > 200) e.descricao = 'A descrição deve ter no máximo 200 caracteres.'
  if (!CATEGORIAS.includes(r.categoria)) e.categoria = 'Selecione uma categoria válida.'
  if (!SITUACOES.includes(r.situacao)) e.situacao = 'Selecione uma situação válida.'
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

// Enter navega para o próximo campo (mesma ordem do Tab) — molde PerfisFormulario.
const SELECTOR_FOCO =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

const aoEnter = (e: KeyboardEvent) => {
  const alvo = e.target as HTMLElement | null
  if (!alvo || alvo.tagName !== 'INPUT') return
  if (alvo.closest('[data-busca]')) return

  const raiz = e.currentTarget as HTMLElement
  const lista = Array.from(raiz.querySelectorAll<HTMLElement>(SELECTOR_FOCO)).filter(
    (el) => el.offsetParent !== null
  )
  const i = lista.indexOf(alvo)
  if (i === -1 || i === lista.length - 1) return

  e.preventDefault()
  const proximo = lista[i + 1]
  if (!proximo) return
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

const salvar = async () => {
  if (salvando.value) return
  erros.value = validar(rascunho.value)
  const primeiro = ORDEM_FOCO.find((campo) => erros.value[campo])
  if (primeiro) {
    focarCampo(primeiro)
    return
  }
  if (erros.value.categoria || erros.value.situacao) return

  // Gravação via API (contrato da capability `softwares`): o servidor gera o
  // código na criação e resolve criado_em/atualizado_em — o cliente envia só os
  // campos editáveis (o código é imutável).
  salvando.value = true
  try {
    const { base } = await salvarSoftware(softwares.value, rascunho.value, props.modo)
    softwares.value = base

    toast.success(
      'Softwares',
      props.modo === 'novo' ? 'Software incluído com sucesso.' : 'Software atualizado com sucesso.'
    )
    emit('update:modelValue', false)
  } catch (erro) {
    const status = (erro as { statusCode?: number }).statusCode
    if (status === 400) {
      const mensagem =
        (erro as { data?: { statusMessage?: string } }).data?.statusMessage ??
        'Informe a descrição do software.'
      erros.value = { descricao: mensagem }
      focarCampo('descricao')
      return
    }
    toast.danger('Softwares', 'Não foi possível salvar o software. Tente novamente.')
  } finally {
    salvando.value = false
  }
}

const cancelar = () => emit('update:modelValue', false)

// Abertura: rascunho novo ou cópia do registro
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      erros.value = {}
      rascunho.value =
        props.modo === 'editar' && props.software
          ? { ...props.software }
          : rascunhoVazio()
    }
  },
  { immediate: true }
)

// Erros persistentes acompanham o campo: somem quando a regra volta a passar.
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

const opcoesCategoria = CATEGORIAS.map((c) => ({ value: c, label: c }))
const definirCategoria = (valor: string | number) => {
  rascunho.value.categoria = String(valor) as CategoriaSoftware
}
const segmentosSituacao: { value: SituacaoSoftware; label: string; tone: 'emerald' | 'slate' }[] = [
  { value: 'Ativo', label: 'Ativo', tone: 'emerald' },
  { value: 'Inativo', label: 'Inativo', tone: 'slate' }
]

const criadoTexto = () => formatarDataHora(rascunho.value.criado_em) || '-'
const atualizadoTexto = () => formatarDataHora(rascunho.value.atualizado_em) || '-'
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="modo === 'novo' ? 'Novo Software' : 'Editar Software'"
    subtitle="Dados cadastrais do software"
    :icon="Boxes"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-y-[11px]" @keydown.enter="aoEnter">
      <!-- 1. Dados do Software -->
      <UiModalSection
        title="Dados do Software"
        :icon="Boxes"
        class="[&>div.grid]:gap-y-[11px]"
      >
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
          <div class="flex flex-col gap-[11px] sm:col-span-6 sm:flex-row sm:gap-4">
            <div v-if="modo === 'editar'" class="sm:w-[calc(10ch+32px)] sm:shrink-0">
              <UiInput label="Código" :model-value="rascunho.codigo" disabled mono />
            </div>
            <UiInput
              v-model="rascunho.descricao"
              data-campo="descricao"
              class="flex-1"
              label="Descrição"
              placeholder="Ex.: Teorema ERP"
              :error="erros.descricao"
            />
          </div>
          <div data-campo="categoria" class="sm:col-span-3">
            <UiSelect
              :model-value="rascunho.categoria"
              :options="opcoesCategoria"
              label="Categoria"
              placeholder="Selecione a categoria"
              :clearable="false"
              :error="erros.categoria"
              @update:model-value="definirCategoria"
            />
          </div>
          <UiSegmented
            v-model="rascunho.situacao"
            data-campo="situacao"
            class="sm:col-span-3"
            label="Situação"
            :options="segmentosSituacao"
            :error="erros.situacao"
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
          <UiInput label="Criado em" :model-value="criadoTexto()" disabled />
          <UiInput label="Atualizado em" :model-value="atualizadoTexto()" disabled />
        </div>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" :loading="salvando" @click="salvar">Salvar</UiButton>
    </template>
  </UiModal>
</template>
