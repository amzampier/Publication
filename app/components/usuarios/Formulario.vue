<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  User,
  MapPin,
  Mail,
  Clock,
  MapPinCheck,
  LoaderCircle,
  Eye,
  EyeOff
} from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { useBuscaCep } from '../../composables/useBuscaCep'
import { UFS, REGIOES } from '../../config/brasil'
import {
  formatarDataHora,
  enderecoVazio,
  smtpVazio,
  type UsuarioModelo,
  type ModoUsuario,
  type PerfilUsuario,
  type StatusUsuario
} from './useUsuariosModelo'
import { salvarUsuario, useUsuarios } from './useUsuarios'

interface Props {
  modelValue: boolean
  modo: ModoUsuario
  usuario: UsuarioModelo | null
}

const props = withDefaults(defineProps<Props>(), {
  usuario: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()
const { usuarios, carregarUsuarios, opcoes } = useUsuarios()

/** Rascunho do modal: base do usuário + senha/confirmação e perfis ainda sem seleção. */
type Rascunho = Omit<UsuarioModelo, 'perfil' | 'status'> & {
  perfil: PerfilUsuario | ''
  status: StatusUsuario | ''
  senha: string
  confirmarSenha: string
}

const rascunhoVazio = (): Rascunho => ({
  id: '',
  nome: '',
  email: '',
  perfil: '',
  status: '',
  ultimoAcesso: null,
  telefone: '',
  funcao: '',
  departamento: '',
  endereco: enderecoVazio(),
  smtp: smtpVazio(),
  avatar: '',
  dataCadastro: null,
  atualizadoEm: null,
  senha: '',
  confirmarSenha: ''
})

const rascunhoDoUsuario = (u: UsuarioModelo): Rascunho => ({
  id: u.id,
  nome: u.nome,
  email: u.email,
  perfil: u.perfil,
  status: u.status,
  ultimoAcesso: u.ultimoAcesso,
  telefone: u.telefone,
  funcao: u.funcao,
  departamento: u.departamento,
  endereco: { ...u.endereco },
  smtp: { ...u.smtp },
  avatar: u.avatar,
  dataCadastro: u.dataCadastro,
  atualizadoEm: u.atualizadoEm,
  senha: '',
  confirmarSenha: ''
})

const rascunho = ref<Rascunho>(rascunhoVazio())
const erros = ref<Record<string, string>>({})
const mostrarSenha = ref(false)
const mostrarConfirmacao = ref(false)
const cameraAberta = ref(false)

const ORDEM_FOCO = ['nome', 'email', 'status', 'perfil', 'senha', 'confirmarSenha']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validar = (
  r: Rascunho,
  modo: ModoUsuario,
  base: UsuarioModelo[]
): Record<string, string> => {
  const e: Record<string, string> = {}

  if (!r.nome.trim()) e.nome = 'Informe o nome.'

  const email = r.email.trim()
  if (!email) {
    e.email = 'Informe o e-mail.'
  } else if (!EMAIL_RE.test(email)) {
    e.email = 'E-mail em formato inválido.'
  } else if (
    base.some(
      (u) => u.id !== r.id && u.email.trim().toLowerCase() === email.toLowerCase()
    )
  ) {
    e.email = 'E-mail já cadastrado para outro usuário.'
  }

  if (!r.perfil) e.perfil = 'Selecione o perfil.'
  if (!r.status) e.status = 'Selecione o status.'

  const temSenha = r.senha.length > 0
  const temConfirmacao = r.confirmarSenha.length > 0

  if (modo === 'novo') {
    if (!temSenha) e.senha = 'Informe a senha.'
    else if (r.senha.length < 8) e.senha = 'A senha deve ter pelo menos 8 caracteres.'
    if (!temConfirmacao) e.confirmarSenha = 'Confirme a senha.'
    else if (temSenha && r.senha !== r.confirmarSenha) e.confirmarSenha = 'As senhas não conferem.'
  } else if (temSenha !== temConfirmacao) {
    if (temSenha) e.confirmarSenha = 'Confirme a senha.'
    else e.senha = 'Informe a senha.'
  } else if (temSenha && r.senha !== r.confirmarSenha) {
    e.confirmarSenha = 'As senhas não conferem.'
  }

  return e
}

const focarCampo = (campo: string) => {
  nextTick(() => {
    const wrapper = document.querySelector<HTMLElement>(`[data-campo="${campo}"]`)
    const alvo = wrapper?.querySelector<HTMLElement>(
      'input:not([disabled]), [role="combobox"], [role="radio"][tabindex="0"], [role="radio"]'
    )
    alvo?.focus()
  })
}

// --- Enter navega para o próximo campo (mesma ordem do Tab) ---
// Foca o elemento real (<input>, gatilho do Select, botão) — nunca o wrapper —
// e reposiciona a caret no fim para o cursor aparecer dentro do próximo input.
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
  if (!proximo) return
  proximo.focus()
  if (proximo.tagName === 'INPUT') {
    const input = proximo as HTMLInputElement
    try {
      const fim = input.value.length
      input.setSelectionRange(fim, fim)
    } catch {
      // tipos sem suporte a selectionRange (ex.: e-mail em alguns navegadores)
    }
  }
}

const salvando = ref(false)

const salvar = async () => {
  erros.value = validar(rascunho.value, props.modo, usuarios.value)
  const primeiro = ORDEM_FOCO.find((campo) => erros.value[campo])
  if (primeiro) {
    focarCampo(primeiro)
    return
  }

  const { senha, confirmarSenha, perfil, status, ...base } = rascunho.value
  const registro: UsuarioModelo = {
    ...base,
    // Senha provisória: a digitada; na edição com campos vazios a API mantém a
    // vigente (regra do servidor). Avatar dataURL vira arquivo no salvar (D6).
    senha,
    perfil: perfil as PerfilUsuario,
    status: status as StatusUsuario
  }

  salvando.value = true
  try {
    await salvarUsuario(usuarios.value, registro, props.modo)
    // Listagem paginada: recarrega a página/KPIs do servidor (RL02 M-14).
    await carregarUsuarios(true)

    toast.success(
      'Gestão de Usuários',
      props.modo === 'novo'
        ? 'Usuário criado com sucesso.'
        : 'Usuário atualizado com sucesso.'
    )
    emit('update:modelValue', false)
  } catch (erro) {
    const status = (erro as { statusCode?: number }).statusCode
    const mensagem = (erro as { data?: { statusMessage?: string } }).data?.statusMessage
    if (status === 409) {
      erros.value = { email: mensagem ?? 'Este e-mail já está cadastrado.' }
      focarCampo('email')
      return
    }
    if (status === 400 && mensagem) {
      const alvo = mensagem.toLowerCase().includes('senha')
        ? 'senha'
        : mensagem.toLowerCase().includes('e-mail')
          ? 'email'
          : mensagem.toLowerCase().includes('nome')
            ? 'nome'
            : null
      if (alvo) {
        erros.value = { [alvo]: mensagem }
        focarCampo(alvo)
        return
      }
    }
    toast.danger(
      'Gestão de Usuários',
      mensagem ?? 'Não foi possível salvar o usuário. Tente novamente.'
    )
  } finally {
    salvando.value = false
  }
}

const cancelar = () => emit('update:modelValue', false)

// Abertura: rascunho novo ou cópia do registro (SMTP sempre "Não testado" na abertura)
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      erros.value = {}
      mostrarSenha.value = false
      mostrarConfirmacao.value = false
      cameraAberta.value = false
      rascunho.value =
        props.modo === 'editar' && props.usuario
          ? rascunhoDoUsuario(props.usuario)
          : rascunhoVazio()
    } else {
      cameraAberta.value = false
    }
  },
  { immediate: true }
)

// Erros são persistents mas acompanham o campo: some quando a regra volta a passar
watch(
  rascunho,
  () => {
    if (!Object.keys(erros.value).length) return
    const atuais = validar(rascunho.value, props.modo, usuarios.value)
    for (const campo of Object.keys(erros.value)) {
      if (atuais[campo]) erros.value[campo] = atuais[campo]
      else delete erros.value[campo]
    }
  },
  { deep: true }
)

// --- Avatar (upload de arquivo ou captura de câmera) ---
const aoTrocarAvatar = (arquivos: File[] | null) => {
  if (!arquivos || !arquivos.length) {
    rascunho.value.avatar = ''
    return
  }
  const imagem = arquivos[0]
  if (!imagem || !imagem.type.startsWith('image/')) return
  const leitor = new FileReader()
  leitor.onload = () => {
    rascunho.value.avatar = String(leitor.result)
  }
  leitor.readAsDataURL(imagem)
}

const aoFotoCapturada = (dataUrl: string) => {
  rascunho.value.avatar = dataUrl
  cameraAberta.value = false
}

// --- CEP: busca ViaCEP real (capability busca-cep) ---
// Getter porque o rascunho é trocado por referência a cada abertura do modal
const { carregando: carregandoCep, buscar: buscarCep } = useBuscaCep(
  () => rascunho.value.endereco,
  'Gestão de Usuários'
)

// --- Datas de cadastro (desabilitadas; seção só na edição) ---
const dataCadastroTexto = computed(() => formatarDataHora(rascunho.value.dataCadastro))
const atualizadoTexto = computed(() => formatarDataHora(rascunho.value.atualizadoEm))

const opcoesPerfil = computed(() => opcoes.value.perfis.map((p) => ({ value: p, label: p })))
const segmentosStatus: { value: StatusUsuario; label: StatusUsuario; tone: 'emerald' | 'slate' }[] = [
  { value: 'Ativo', label: 'Ativo', tone: 'emerald' },
  { value: 'Inativo', label: 'Inativo', tone: 'slate' }
]
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="modo === 'novo' ? 'Novo Usuário' : 'Editar Usuário'"
    subtitle="Dados, acesso ao sistema e preferências do usuário"
    :icon="User"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-y-[11px]" @keydown.enter="aoEnter">
      <!-- 1. Dados do Usuário -->
      <UiModalSection
        title="Dados do Usuário"
        :icon="User"
        class="[&>div.grid]:gap-y-[11px]"
      >
        <div class="grid gap-x-4 gap-y-[11px] md:grid-cols-[200px_1fr]">
          <UiUploadFiles
            forma="circular"
            compacto
            rotulo="Foto"
            dica="PNG ou JPG"
            aceitar="image/*"
            :acoes-no-foco="false"
            :preview="rascunho.avatar"
            @change="aoTrocarAvatar"
            @camera="cameraAberta = true"
          />
          <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-6">
            <UiInput
              v-model="rascunho.nome"
              data-campo="nome"
              class="sm:col-span-3"
              label="Nome"
              placeholder="Nome completo"
              :error="erros.nome"
            />
            <UiInput
              v-model="rascunho.email"
              data-campo="email"
              class="sm:col-span-3"
              label="E-mail"
              type="email"
              placeholder="nome@empresa.com.br"
              :error="erros.email"
            />
            <UiInput
              v-model="rascunho.telefone"
              class="sm:col-span-2"
              label="Telefone"
              mask="(99) 99999-9999"
              placeholder="(00) 00000-0000"
            />
            <UiInput
              v-model="rascunho.funcao"
              class="sm:col-span-2"
              label="Função"
              placeholder="Ex.: Jornalista"
            />
            <UiInput
              v-model="rascunho.departamento"
              class="sm:col-span-2"
              label="Departamento"
              placeholder="Ex.: Redação"
            />
          </div>
        </div>

        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-4">
          <UiSegmented
            v-model="rascunho.status"
            data-campo="status"
            label="Status"
            :options="segmentosStatus"
            :error="erros.status"
          />
          <UiSelect
            v-model="rascunho.perfil"
            data-campo="perfil"
            label="Perfil"
            placeholder="Selecione o perfil..."
            :options="opcoesPerfil"
            :error="erros.perfil"
          />
          <UiInput
            v-model="rascunho.senha"
            data-campo="senha"
            label="Senha"
            :type="mostrarSenha ? 'text' : 'password'"
            placeholder="Mínimo de 8 caracteres"
            :right-icon="mostrarSenha ? EyeOff : Eye"
            :error="erros.senha"
            :right-icon-label="'Mostrar ou ocultar senha'"
            @right-icon-click="mostrarSenha = !mostrarSenha"
          />
          <UiInput
            v-model="rascunho.confirmarSenha"
            data-campo="confirmarSenha"
            label="Confirmar Senha"
            :type="mostrarConfirmacao ? 'text' : 'password'"
            placeholder="Repita a senha"
            :right-icon="mostrarConfirmacao ? EyeOff : Eye"
            :error="erros.confirmarSenha"
            :right-icon-label="'Mostrar ou ocultar senha'"
            @right-icon-click="mostrarConfirmacao = !mostrarConfirmacao"
          />
        </div>
      </UiModalSection>

      <!-- 2. Endereço -->
      <UiModalSection
        title="Endereço"
        :icon="MapPin"
        class="[&>div.grid]:gap-y-[11px]"
      >
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-12">
          <div class="flex items-end gap-2 sm:col-span-3">
            <UiInput
              v-model="rascunho.endereco.cep"
              class="min-w-0 flex-1"
              label="CEP"
              mask="99999-999"
              placeholder="00000-000"
            />
            <UiTooltip content="Buscar CEP (ViaCEP)" position="top">
              <span
                role="button"
                tabindex="0"
                aria-label="Buscar CEP (ViaCEP)"
                :aria-busy="carregandoCep ? 'true' : undefined"
                :class="[
                  'mb-[1px] flex h-[34px] w-5 shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus',
                  carregandoCep
                    ? 'pointer-events-none'
                    : 'cursor-pointer'
                ]"
                @click="buscarCep"
                @keydown.enter.prevent="buscarCep"
                @keydown.space.prevent="buscarCep"
              >
                <LoaderCircle
                  v-if="carregandoCep"
                  class="h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <MapPinCheck v-else class="h-4 w-4" aria-hidden="true" />
              </span>
            </UiTooltip>
          </div>
          <UiInput
            v-model="rascunho.endereco.logradouro"
            class="sm:col-span-5"
            label="Endereço"
            placeholder="Rua, avenida..."
          />
          <UiInput
            v-model="rascunho.endereco.numero"
            class="sm:col-span-2"
            label="Número"
            placeholder="123"
          />
          <UiInput
            v-model="rascunho.endereco.complemento"
            class="sm:col-span-2"
            label="Complemento"
            placeholder="Apto, bloco..."
          />
          <UiInput
            v-model="rascunho.endereco.bairro"
            class="sm:col-span-3"
            label="Bairro"
            placeholder="Bairro"
          />
          <UiInput
            v-model="rascunho.endereco.cidade"
            class="sm:col-span-4"
            label="Cidade"
            placeholder="Cidade"
          />
          <UiSelect
            v-model="rascunho.endereco.estado"
            class="sm:col-span-2"
            label="Estado"
            placeholder="Selecione o estado..."
            :options="UFS"
          />
          <UiSelect
            v-model="rascunho.endereco.regiao"
            class="sm:col-span-3"
            label="Região"
            placeholder="Selecione a região..."
            :options="REGIOES"
          />
        </div>
      </UiModalSection>

      <!-- 3. Configurações de E-mail (bloco extraído - compartilhado com Meu Perfil) -->
      <UiModalSection
        title="Configurações de E-mail"
        :icon="Mail"
        class="[&>div.grid]:gap-y-[11px]"
      >
        <UsuariosCamposSmtp v-model="rascunho.smtp" />
      </UiModalSection>

      <!-- 4. Informações de Cadastro — somente na edição; a criação abre com os
           blocos 1 a 3, sem esta seção -->
      <UiModalSection
        v-if="modo === 'editar'"
        title="Informações de Cadastro"
        :icon="Clock"
        class="[&>div.grid]:gap-y-[11px]"
      >
        <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
          <UiInput
            label="Data Cadastro"
            :model-value="dataCadastroTexto"
            disabled
          />
          <UiInput
            label="Última Atualização"
            :model-value="atualizadoTexto"
            disabled
          />
        </div>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" :loading="salvando" @click="salvar">Salvar</UiButton>
    </template>
  </UiModal>

  <UiCameraWeb
    v-if="cameraAberta"
    @foto="aoFotoCapturada"
    @fechar="cameraAberta = false"
  />
</template>
