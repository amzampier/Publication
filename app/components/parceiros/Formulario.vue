<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Handshake, Clock } from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { UFS, REGIAO_POR_UF } from '../../config/brasil'
import {
  SITUACOES,
  formatarDataHora,
  salvarParceiro,
  useParceirosModelo,
  type ModoParceiros,
  type ParceiroModelo,
  type SituacaoParceiro
} from './useParceirosModelo'

interface Props {
  modelValue: boolean
  modo: ModoParceiros
  parceiro: ParceiroModelo | null
}

const props = withDefaults(defineProps<Props>(), {
  parceiro: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()
const { parceiros } = useParceirosModelo()
const salvando = ref(false)

/** Rascunho do modal: o registro completo do parceiro. */
const rascunhoVazio = (): ParceiroModelo => ({
  id: '',
  codigo: '',
  razao_social: '',
  nome_fantasia: '',
  cidade: '',
  estado: '',
  regiao: '',
  logo_url: '',
  situacao: 'Ativo',
  criado_em: '',
  atualizado_em: ''
})

const rascunho = ref<ParceiroModelo>(rascunhoVazio())
const erros = ref<Record<string, string>>({})

const ORDEM_FOCO = ['razao_social', 'nome_fantasia']

const validar = (r: ParceiroModelo): Record<string, string> => {
  const e: Record<string, string> = {}
  const razao = r.razao_social.trim()
  if (!razao) e.razao_social = 'Informe a razão social do parceiro.'
  else if (razao.length > 255) e.razao_social = 'A razão social deve ter no máximo 255 caracteres.'
  const nome = r.nome_fantasia.trim()
  if (!nome) e.nome_fantasia = 'Informe o nome fantasia do parceiro.'
  else if (nome.length > 150) e.nome_fantasia = 'O nome fantasia deve ter no máximo 150 caracteres.'
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

// Enter navega para o próximo campo (mesma ordem do Tab).
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
  if (erros.value.situacao) return

  salvando.value = true
  try {
    const { base } = await salvarParceiro(parceiros.value, rascunho.value, props.modo)
    parceiros.value = base

    toast.success(
      'Parceiros',
      props.modo === 'novo' ? 'Parceiro incluído com sucesso.' : 'Parceiro atualizado com sucesso.'
    )
    emit('update:modelValue', false)
  } catch (erro) {
    const status = (erro as { statusCode?: number }).statusCode
    if (status === 400) {
      const mensagem =
        (erro as { data?: { statusMessage?: string } }).data?.statusMessage ??
        'Informe os dados do parceiro.'
      erros.value = { razao_social: mensagem }
      focarCampo('razao_social')
      return
    }
    toast.danger('Parceiros', 'Não foi possível salvar o parceiro. Tente novamente.')
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
        props.modo === 'editar' && props.parceiro ? { ...props.parceiro } : rascunhoVazio()
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

const opcoesEstado = UFS
const definirEstado = (valor: string | number) => {
  const uf = String(valor)
  rascunho.value.estado = uf
  rascunho.value.regiao = (REGIAO_POR_UF[uf] ?? '') as ParceiroModelo['regiao']
}

const segmentosSituacao: { value: SituacaoParceiro; label: string; tone: 'emerald' | 'slate' | 'rose' }[] = [
  { value: 'Ativo', label: 'Ativo', tone: 'emerald' },
  { value: 'Inativo', label: 'Inativo', tone: 'slate' },
  { value: 'Bloqueado', label: 'Bloqueado', tone: 'rose' }
]

// --- Logo (upload de arquivo) ---
const aoTrocarLogo = (arquivos: File[] | null) => {
  if (!arquivos || !arquivos.length) {
    rascunho.value.logo_url = ''
    return
  }
  const imagem = arquivos[0]
  if (!imagem || !imagem.type.startsWith('image/')) return
  const leitor = new FileReader()
  leitor.onload = () => {
    rascunho.value.logo_url = String(leitor.result)
  }
  leitor.readAsDataURL(imagem)
}

const criadoTexto = computed(() => formatarDataHora(rascunho.value.criado_em) || '-')
const atualizadoTexto = computed(() => formatarDataHora(rascunho.value.atualizado_em) || '-')
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="modo === 'novo' ? 'Novo Parceiro' : 'Editar Parceiro'"
    subtitle="Dados cadastrais do parceiro"
    :icon="Handshake"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-y-[11px]" @keydown.enter="aoEnter">
      <!-- 1. Dados do Parceiro -->
      <UiModalSection title="Dados do Parceiro" :icon="Handshake" class="[&>div.grid]:gap-y-[11px]">
        <!-- Logo à esquerda; Código/Razão Social/Nome Fantasia no container da direita -->
        <div class="grid gap-x-4 gap-y-[11px] md:grid-cols-[200px_1fr]">
          <UiUploadFiles
            rotulo="Logo"
            dica="PNG ou JPG"
            aceitar="image/*"
            forma="retangular"
            :multiple="false"
            :mostrar-camera="false"
            :acoes-no-foco="false"
            :preview="rascunho.logo_url"
            @change="aoTrocarLogo"
          />

          <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
            <div class="flex flex-col gap-[11px] sm:col-span-6 sm:flex-row sm:gap-4">
              <div v-if="modo === 'editar'" class="sm:w-[5.5rem] sm:shrink-0">
                <UiInput label="Código" :model-value="rascunho.codigo" disabled mono />
              </div>
              <UiInput
                v-model="rascunho.razao_social"
                data-campo="razao_social"
                class="flex-1"
                label="Razão Social"
                placeholder="Ex.: Nexus Corp Ltda"
                :error="erros.razao_social"
              />
            </div>
            <UiInput
              v-model="rascunho.nome_fantasia"
              data-campo="nome_fantasia"
              class="sm:col-span-6"
              label="Nome Fantasia"
              placeholder="Ex.: Nexus"
              :error="erros.nome_fantasia"
            />
          </div>
        </div>

        <!-- Demais campos -->
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
          <UiInput
            v-model="rascunho.cidade"
            class="sm:col-span-4"
            label="Cidade"
            placeholder="Cidade sede"
          />
          <div data-campo="estado" class="sm:col-span-2">
            <UiSelect
              :model-value="rascunho.estado"
              :options="opcoesEstado"
              label="Estado"
              placeholder="Selecione a UF"
              :clearable="false"
              @update:model-value="definirEstado"
            />
          </div>

          <UiInput
            class="sm:col-span-3"
            label="Região"
            :model-value="rascunho.regiao"
            placeholder="Derivada do estado"
            disabled
          />
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

      <!-- 2. Informações de Cadastro — somente na edição -->
      <UiModalSection
        v-if="modo === 'editar'"
        title="Informações de Cadastro"
        :icon="Clock"
        class="[&>div.grid]:gap-y-[11px]"
      >
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
          <UiInput label="Criado em" :model-value="criadoTexto" disabled />
          <UiInput label="Atualizado em" :model-value="atualizadoTexto" disabled />
        </div>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" :loading="salvando" @click="salvar">Salvar</UiButton>
    </template>
  </UiModal>
</template>
