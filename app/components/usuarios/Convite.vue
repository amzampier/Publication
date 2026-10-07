<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  Send,
  User,
  Mail,
  MessageCircle,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
  RefreshCw,
  Smartphone
} from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import {
  useUsuariosDemo,
  VARIANTE_POR_PERFIL,
  VARIANTE_POR_STATUS,
  type UsuarioDemo
} from './useUsuariosDemo'
import {
  renderHtmlConvite,
  renderTextoConvite,
  gerarSenhaProvisoria,
  normalizarTelefoneWhats,
  type DadosConvite
} from '../../utils/conviteTemplate'

interface Props {
  modelValue: boolean
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

type Canal = 'email' | 'whatsapp'

// Registro vigente na base (o objeto do gatilho fica defasado após gravar a senha)
const registro = computed<UsuarioDemo | null>(() => {
  const id = props.usuario?.id
  if (!id) return props.usuario
  return usuarios.value.find((u) => u.id === id) ?? props.usuario
})

// Rascunho local — descartado no Cancelar/Escape/X, gravado só no envio (D6/D7)
const canal = ref<Canal>('email')
const senha = ref('')
const mostrarSenha = ref(false)

let timerFallback: ReturnType<typeof setTimeout> | null = null
let aoPerderFoco: (() => void) | null = null

const limparFallback = () => {
  if (timerFallback) {
    clearTimeout(timerFallback)
    timerFallback = null
  }
  if (aoPerderFoco) {
    window.removeEventListener('blur', aoPerderFoco)
    aoPerderFoco = null
  }
}

onBeforeUnmount(limparFallback)

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      canal.value = 'email'
      mostrarSenha.value = false
      senha.value = registro.value?.senha ?? ''
    }
    // Fechar NÃO cancela o fallback: o timer do WhatsApp precisa sobreviver ao
    // fechamento pós-envio (~2 s) — só o unmount o limpa.
  },
  { immediate: true }
)

const temTelefone = computed(() => Boolean(registro.value?.telefone?.trim()))
const senhaExistente = computed(() => Boolean(registro.value?.senha))
const podeEnviar = computed(() => senha.value.trim().length >= 8)

const iniciais = computed(() =>
  (registro.value?.nome ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] ?? '')
    .join('')
    .toUpperCase()
)

const dados = computed<DadosConvite>(() => ({
  nome: registro.value?.nome ?? '',
  email: registro.value?.email ?? '',
  perfil: registro.value?.perfil ?? '',
  senha: senha.value,
  telefone: registro.value?.telefone ?? ''
}))

const htmlConvite = computed(() => renderHtmlConvite(dados.value))
const textoConvite = computed(() => renderTextoConvite(dados.value))

const gerarSenha = () => {
  senha.value = gerarSenhaProvisoria()
}

const copiar = async (texto: string, mensagem: string) => {
  try {
    await navigator.clipboard.writeText(texto)
    toast.success('Gestão de Usuários', mensagem)
  } catch {
    toast.info('Gestão de Usuários', 'Não foi possível copiar automaticamente.')
  }
}

const fechar = () => emit('update:modelValue', false)

// Grava a senha provisória no registro em memória e dispara o canal (D4)
const enviar = () => {
  const alvo = registro.value
  if (!alvo || !podeEnviar.value) return

  usuarios.value = usuarios.value.map((u) =>
    u.id === alvo.id ? { ...u, senha: senha.value } : u
  )

  if (canal.value === 'email') {
    // Frontend-only: envio simulado, sem abrir cliente de e-mail (Resend = backend futuro)
    toast.success(
      'Gestão de Usuários',
      'Convite por e-mail em simulação — o envio real via Resend entra na fase de backend.'
    )
    fechar()
    return
  }

  const texto = textoConvite.value
  const numero = normalizarTelefoneWhats(alvo.telefone)
  const urlWeb = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
  // Fallback web ~2 s após o intent (D4). Foco mantido = app não abriu → web.
  // Blur síncrono (≤300 ms) = o handler do protocolo falhou sem exibir janela
  // (desktop que rouba o foco e não aparece) → também cai para o web; blur
  // tardio = app realmente abriu → web suprimido para não duplicar a aba.
  const instante = performance.now()
  let falhaInstantanea = false
  aoPerderFoco = () => {
    if (performance.now() - instante <= 300) falhaInstantanea = true
  }
  window.addEventListener('blur', aoPerderFoco)
  window.location.href = `whatsapp://send?phone=${numero}&text=${encodeURIComponent(texto)}`
  timerFallback = setTimeout(() => {
    timerFallback = null
    window.removeEventListener('blur', aoPerderFoco!)
    aoPerderFoco = null
    if (document.hasFocus() || falhaInstantanea)
      window.open(urlWeb, '_blank', 'noopener,noreferrer')
  }, 2000)
  toast.success('Gestão de Usuários', 'Convite aberto no WhatsApp.')
  fechar()
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    title="Enviar Convite"
    subtitle="Envie as credenciais de acesso pelo canal escolhido com o template padrão."
    :icon="Send"
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      v-if="registro"
      class="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]"
    >
      <div class="grid gap-y-[11px]">
      <!-- 1. Destinatário -->
      <UiModalSection title="Destinatário" :icon="User">
        <div class="flex items-center gap-4">
          <img
            v-if="registro.avatar"
            :src="registro.avatar"
            alt=""
            class="h-12 w-12 rounded-full object-cover shrink-0"
          />
          <div
            v-else
            class="h-12 w-12 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold shrink-0"
            aria-hidden="true"
          >
            {{ iniciais }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-bold text-slate-900 truncate">{{ registro.nome }}</p>
              <UiBadge :variant="VARIANTE_POR_PERFIL[registro.perfil]" size="sm">
                {{ registro.perfil }}
              </UiBadge>
              <UiBadge :variant="VARIANTE_POR_STATUS[registro.status]" size="sm">
                {{ registro.status }}
              </UiBadge>
            </div>
            <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span class="inline-flex items-center gap-1.5 min-w-0">
                <Mail class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span class="truncate">{{ registro.email }}</span>
              </span>
              <span class="inline-flex items-center gap-1.5 min-w-0">
                <Smartphone class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span class="truncate">{{ registro.telefone || 'Sem telefone cadastrado' }}</span>
              </span>
            </div>
          </div>
        </div>
      </UiModalSection>

      <!-- 2. Canal de Envio -->
      <UiModalSection title="Canal de Envio" :icon="MessageCircle">
        <div role="radiogroup" aria-label="Canal de envio do convite" class="grid sm:grid-cols-2 gap-3">
          <UiChoiceCard
            v-model="canal"
            value="email"
            title="E-mail"
            description="Envio pelo sistema em simulação — nenhum cliente de e-mail é aberto."
            :icon="Mail"
            tone="sky"
          />
          <UiChoiceCard
            v-model="canal"
            value="whatsapp"
            title="WhatsApp"
            description="Abre o aplicativo desktop com a mensagem preenchida."
            :icon="MessageCircle"
            tone="emerald"
            :disabled="!temTelefone"
            disabled-hint="Telefone não cadastrado — informe o telefone para liberar o canal."
          />
        </div>
      </UiModalSection>

      <!-- 3. Credenciais de Acesso — login e senha na mesma linha, botão abaixo (D8) -->
      <UiModalSection title="Credenciais de Acesso" :icon="KeyRound">
        <div class="grid gap-2">
          <div class="grid grid-cols-2 gap-3 items-start">
            <UiInput label="Login (e-mail)" :model-value="registro.email" disabled />

            <!-- Senha existente: somente-leitura com olho e copiar (D6) -->
            <div v-if="senhaExistente" class="flex items-end gap-2">
              <UiInput
                class="min-w-0 flex-1"
                label="Senha provisória"
                :type="mostrarSenha ? 'text' : 'password'"
                :model-value="senha"
                disabled
                :right-icon="mostrarSenha ? EyeOff : Eye"
                @right-icon-click="mostrarSenha = !mostrarSenha"
              />
              <UiTooltip content="Copiar senha" position="top">
                <button
                  type="button"
                  aria-label="Copiar senha provisória"
                  class="mb-[1px] flex h-[34px] w-5 shrink-0 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
                  @click="copiar(senha, 'Senha provisória copiada.')"
                >
                  <Copy class="h-4 w-4" aria-hidden="true" />
                </button>
              </UiTooltip>
            </div>

            <!-- Senha vazia: campo editável (mínimo 8) -->
            <UiInput
              v-else
              v-model="senha"
              label="Senha provisória"
              :type="mostrarSenha ? 'text' : 'password'"
              placeholder="Mínimo de 8 caracteres"
              :right-icon="mostrarSenha ? EyeOff : Eye"
              :helper-text="
                podeEnviar
                  ? ''
                  : 'Informe ou gere uma senha de ao menos 8 caracteres para habilitar o envio.'
              "
              @right-icon-click="mostrarSenha = !mostrarSenha"
            />
          </div>

          <!-- Gerar senha (vazia) / Redefinir senha (existente) — abaixo, à direita -->
          <div class="flex justify-end">
            <UiButton variant="outline" size="sm" @click="gerarSenha">
              <template #leftIcon>
                <RefreshCw v-if="senhaExistente" class="h-3.5 w-3.5" />
                <Sparkles v-else class="h-3.5 w-3.5" />
              </template>
              {{ senhaExistente ? 'Redefinir senha' : 'Gerar senha' }}
            </UiButton>
          </div>
        </div>
      </UiModalSection>
    </div>

    <!-- 4. Pré-visualização — só o template, sem tarja; coluna da direita estica até a
         altura da esquerda (D8) -->
    <UiModalSection
      v-if="registro"
      title="Pré-visualização"
      :icon="Eye"
      class="flex flex-col [&>div:last-child]:flex-1 [&>div:last-child]:grid-rows-[minmax(0,1fr)]"
    >
        <iframe
          v-if="canal === 'email'"
          :srcdoc="htmlConvite"
          title="Pré-visualização do convite"
          sandbox
          class="w-full h-full min-h-[280px] border border-slate-200 rounded-lg bg-white"
        />
        <pre
          v-else
          class="h-full min-h-[280px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 font-mono"
        >{{ textoConvite }}</pre>
      </UiModalSection>
    </div>

    <template #footer>
      <UiButton
        variant="outline"
        size="md"
        class="mr-auto"
        @click="copiar(textoConvite, 'Mensagem copiada para a área de transferência.')"
      >
        <template #leftIcon><Copy class="h-3.5 w-3.5" /></template>
        Copiar mensagem
      </UiButton>
      <UiButton variant="outline" size="md" @click="fechar">Cancelar</UiButton>
      <UiButton
        variant="primary"
        size="md"
        :disabled="!podeEnviar"
        :title="podeEnviar ? '' : 'Informe ou gere a senha provisória (mínimo de 8 caracteres).'"
        @click="enviar"
      >
        <template #leftIcon><Send class="h-3.5 w-3.5" /></template>
        Enviar Convite
      </UiButton>
    </template>
  </UiModal>
</template>
