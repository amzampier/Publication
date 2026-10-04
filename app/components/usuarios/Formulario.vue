<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import {
  User,
  MapPin,
  Mail,
  Clock,
  MapPinCheck,
  Eye,
  EyeOff,
  PlugZap,
  Send
} from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { UFS, REGIOES, PROVEDORES_SMTP, SEGURANCAS_SMTP, PORTAS_SMTP_VALIDAS } from '../../config/brasil'
import {
  useUsuariosDemo,
  salvarUsuario,
  formatarDataHora,
  enderecoVazio,
  smtpVazio,
  PERFIS,
  type UsuarioDemo,
  type ModoUsuario,
  type PerfilUsuario,
  type StatusUsuario,
  type StatusSmtp
} from './useUsuariosDemo'

interface Props {
  modelValue: boolean
  modo: ModoUsuario
  usuario: UsuarioDemo | null
}

const props = withDefaults(defineProps<Props>(), {
  usuario: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()
const { usuarios } = useUsuariosDemo()

/** Rascunho do modal: base do usuário + senha/confirmação e perfis ainda sem seleção. */
type Rascunho = Omit<UsuarioDemo, 'perfil' | 'status'> & {
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

const rascunhoDoUsuario = (u: UsuarioDemo): Rascunho => ({
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
  smtp: { ...u.smtp, status: 'nao-testado' },
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
// Evita que watchers de abertura (porta sugerida/reset do SMTP) rodem no bootstrap do rascunho
let inicializando = false
// Porta editada à mão depois da sugestão: segurança deixa de sobrescrever
let portaManual = false

const ORDEM_FOCO = ['nome', 'email', 'status', 'perfil', 'senha', 'confirmarSenha']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Timer do teste de SMTP (cancelado no fechamento, no reset e no unmount)
let timer: ReturnType<typeof setTimeout> | null = null

const limparTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const validar = (
  r: Rascunho,
  modo: ModoUsuario,
  base: UsuarioDemo[]
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

const salvar = () => {
  erros.value = validar(rascunho.value, props.modo, usuarios.value)
  const primeiro = ORDEM_FOCO.find((campo) => erros.value[campo])
  if (primeiro) {
    focarCampo(primeiro)
    return
  }

  const { senha, confirmarSenha, perfil, status, ...base } = rascunho.value
  const registro: UsuarioDemo = {
    ...base,
    perfil: perfil as PerfilUsuario,
    status: status as StatusUsuario
  }
  const { base: novaBase } = salvarUsuario(usuarios.value, registro, props.modo)
  usuarios.value = novaBase

  toast.success(
    'Gestão de Usuários',
    props.modo === 'novo'
      ? 'Usuário criado com sucesso.'
      : 'Usuário atualizado com sucesso.'
  )
  emit('update:modelValue', false)
}

const cancelar = () => emit('update:modelValue', false)

// Abertura: rascunho novo ou cópia do registro (SMTP sempre "Não testado" na abertura)
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      inicializando = true
      erros.value = {}
      mostrarSenha.value = false
      mostrarConfirmacao.value = false
      cameraAberta.value = false
      portaManual = false
      rascunho.value =
        props.modo === 'editar' && props.usuario
          ? rascunhoDoUsuario(props.usuario)
          : rascunhoVazio()
      nextTick(() => {
        inicializando = false
      })
    } else {
      limparTimer()
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

// Segurança do SMTP sugere a porta (flag impede sobrescrever a porta digitada à mão)
watch(
  () => rascunho.value.smtp.seguranca,
  (seguranca) => {
    if (inicializando || portaManual) return
    const opcao = SEGURANCAS_SMTP.find((s) => s.value === seguranca)
    if (opcao) rascunho.value.smtp.porta = opcao.porta
  }
)

// Editar qualquer campo do bloco zera o Status e cancela um teste em andamento
watch(
  () => [
    rascunho.value.smtp.email,
    rascunho.value.smtp.senha,
    rascunho.value.smtp.provedor,
    rascunho.value.smtp.servidor,
    rascunho.value.smtp.porta,
    rascunho.value.smtp.seguranca
  ],
  () => {
    if (inicializando) return
    limparTimer()
    if (rascunho.value.smtp.status !== 'nao-testado') {
      rascunho.value.smtp.status = 'nao-testado'
    }
  }
)

// --- Máquina de estados do SMTP (simulada, 1.200 ms, sem rede) ---
onBeforeUnmount(limparTimer)

const testando = computed(() => rascunho.value.smtp.status === 'testando')

const podeTestar = computed(() => {
  const s = rascunho.value.smtp
  return Boolean(s.servidor.trim() && s.porta.trim() && s.email.trim())
})

const podeEnviar = computed(() => rascunho.value.smtp.status === 'conectado')

const testarConexao = () => {
  if (!podeTestar.value || testando.value) return
  rascunho.value.smtp.status = 'testando'
  timer = setTimeout(() => {
    timer = null
    rascunho.value.smtp.status = PORTAS_SMTP_VALIDAS.includes(
      rascunho.value.smtp.porta.trim()
    )
      ? 'conectado'
      : 'falha'
  }, 1200)
}

const enviarTeste = () => {
  if (!podeEnviar.value) return
  toast.info(
    'Configurações de E-mail',
    'E-mail de teste enviado em simulação - nenhuma requisição foi feita.'
  )
}

const SMTP_POR_STATUS: Record<
  StatusSmtp,
  { variant: 'neutral' | 'pending' | 'done' | 'blocked'; rotulo: string }
> = {
  'nao-testado': { variant: 'neutral', rotulo: 'Não testado' },
  testando: { variant: 'pending', rotulo: 'Testando' },
  conectado: { variant: 'done', rotulo: 'Conectado' },
  falha: { variant: 'blocked', rotulo: 'Falha' }
}

const statusSmtp = computed(() => SMTP_POR_STATUS[rascunho.value.smtp.status])

// --- Avatar (upload de arquivo ou captura de câmera) ---
const aoTrocarAvatar = (arquivos: File[] | null) => {
  if (!arquivos || !arquivos.length) {
    rascunho.value.avatar = ''
    return
  }
  const imagem = arquivos[0]
  if (!imagem.type.startsWith('image/')) return
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

// --- CEP: integração ViaCEP só na próxima etapa ---
const buscarCep = () => {
  toast.info(
    'Gestão de Usuários',
    'Busca de CEP (ViaCEP): funcionalidade disponível na próxima etapa.'
  )
}

// --- Datas de cadastro (desabilitadas) ---
const dataCadastroTexto = computed(() => formatarDataHora(rascunho.value.dataCadastro))
const atualizadoTexto = computed(() => formatarDataHora(rascunho.value.atualizadoEm))
const textoAuxiliarData = computed(() =>
  props.modo === 'novo' ? 'Preenchidos ao salvar' : ''
)

const opcoesPerfil = PERFIS.map((p) => ({ value: p, label: p }))
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
    <div class="grid gap-4" @keydown.enter="aoEnter">
      <!-- 1. Dados do Usuário -->
      <UiModalSection title="Dados do Usuário" :icon="User">
        <div class="grid gap-4 md:grid-cols-[200px_1fr]">
          <UiUploadFiles
            forma="circular"
            compacto
            rotulo="Foto"
            dica="PNG ou JPG"
            aceitar="image/*"
            :preview="rascunho.avatar"
            @change="aoTrocarAvatar"
            @camera="cameraAberta = true"
          />
          <div class="grid gap-4 sm:grid-cols-6">
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

        <div class="grid gap-4 sm:grid-cols-4">
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
            @right-icon-click="mostrarConfirmacao = !mostrarConfirmacao"
          />
        </div>
      </UiModalSection>

      <!-- 2. Endereço -->
      <UiModalSection title="Endereço" :icon="MapPin">
        <div class="grid gap-4 sm:grid-cols-12">
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
                class="mb-[1px] flex h-[34px] w-5 shrink-0 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
                @click="buscarCep"
                @keydown.enter.prevent="buscarCep"
              >
                <MapPinCheck class="h-4 w-4" aria-hidden="true" />
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

      <!-- 3. Configurações de E-mail -->
      <UiModalSection title="Configurações de E-mail" :icon="Mail">
        <div class="grid gap-4 sm:grid-cols-12">
          <UiInput
            v-model="rascunho.smtp.email"
            class="sm:col-span-6"
            label="E-mail SMTP"
            type="email"
            placeholder="smtp@empresa.com.br"
          />
          <UiInput
            v-model="rascunho.smtp.senha"
            class="sm:col-span-6"
            label="Senha SMTP"
            type="password"
            placeholder="Senha da conta SMTP"
          />
          <UiSelect
            v-model="rascunho.smtp.provedor"
            class="sm:col-span-3"
            label="Provedor"
            placeholder="Selecione o provedor..."
            :options="PROVEDORES_SMTP"
          />
          <UiInput
            v-model="rascunho.smtp.servidor"
            class="sm:col-span-3"
            label="Servidor SMTP"
            placeholder="smtp.empresa.com.br"
          />
          <UiSelect
            v-model="rascunho.smtp.seguranca"
            class="sm:col-span-4"
            label="Segurança"
            placeholder="Selecione a segurança..."
            :options="SEGURANCAS_SMTP"
          />
          <UiInput
            v-model="rascunho.smtp.porta"
            class="sm:col-span-2"
            label="Porta"
            mask="9999"
            placeholder="587"
            @update:model-value="portaManual = true"
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <UiButton
              variant="outline"
              size="sm"
              :disabled="!podeTestar || testando"
              @click="testarConexao"
            >
              <template #leftIcon><PlugZap class="h-3.5 w-3.5" /></template>
              Testar conexão
            </UiButton>
            <UiButton
              variant="outline"
              size="sm"
              :disabled="!podeEnviar || testando"
              @click="enviarTeste"
            >
              <template #leftIcon><Send class="h-3.5 w-3.5" /></template>
              Enviar teste
            </UiButton>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-medium text-slate-500">
              Status da Configuração
            </span>
            <UiBadge :variant="statusSmtp.variant" size="sm">
              {{ statusSmtp.rotulo }}
            </UiBadge>
          </div>
        </div>
      </UiModalSection>

      <!-- 4. Informações de Cadastro (somente na edição) -->
      <UiModalSection
        v-if="modo === 'editar'"
        title="Informações de Cadastro"
        :icon="Clock"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput
            label="Data Cadastro"
            :model-value="dataCadastroTexto"
            disabled
            :helper-text="textoAuxiliarData"
          />
          <UiInput
            label="Última Atualização"
            :model-value="atualizadoTexto"
            disabled
            :helper-text="textoAuxiliarData"
          />
        </div>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton variant="primary" size="md" @click="salvar">Salvar</UiButton>
    </template>
  </UiModal>

  <UiCameraWeb
    v-if="cameraAberta"
    @foto="aoFotoCapturada"
    @fechar="cameraAberta = false"
  />
</template>
