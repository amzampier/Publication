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
  Smartphone
} from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { useApiFetch } from '../../composables/useApiFetch'
import {
  variantePerfil,
  VARIANTE_POR_STATUS,
  type UsuarioModelo
} from './useUsuariosModelo'
import {
  renderHtmlConvite,
  renderTextoConvite,
  gerarSenhaProvisoria,
  normalizarTelefoneWhats,
  type DadosConvite
} from '#shared/utils/emails'

interface Props {
  modelValue: boolean
  usuario: UsuarioModelo | null
}

const props = withDefaults(defineProps<Props>(), {
  usuario: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', valor: boolean): void
}>()

const { toast } = useToast()

type Canal = 'email' | 'whatsapp'

// Registro vigente: a linha REAL vinda da lista (a API nunca expõe senha —
// design D9: o modal sempre oferece "Gerar senha"; a provisória vive só no
// rascunho até o envio gravar o hash no banco).
const registro = computed<UsuarioModelo | null>(() => props.usuario ?? null)

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
      senha.value = ''
    }
    // Fechar NÃO cancela o fallback: o timer do WhatsApp precisa sobreviver ao
    // fechamento pós-envio (~2 s) — só o unmount o limpa.
  },
  { immediate: true }
)

const temTelefone = computed(() => Boolean(registro.value?.telefone?.trim()))
// A lista real não tem campo de senha (hash no banco, nunca exposto): o modal
// sempre começa sem senha — o admin gera/define a provisória antes de enviar
// (D9; RL02 M-04: a UI nunca exibe a senha vigente).
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

/** Link absoluto de acesso — a mensagem sai do navegador (origem atual). */
const linkAcesso = () =>
  (typeof window === 'undefined' ? '' : window.location.origin) + '/admin/login'

const htmlConvite = computed(() => renderHtmlConvite(dados.value, linkAcesso()))
const textoConvite = computed(() => renderTextoConvite(dados.value, linkAcesso()))

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

const enviando = ref(false)

// Grava a senha provisória no BANCO via API (find-or-create por e-mail —
// design D9) e dispara o canal escolhido; a falha do envio mantém o modal
// aberto com toast de erro (spec gestao-usuarios, envio real).
const enviar = async () => {
  const alvo = registro.value
  if (!alvo || !podeEnviar.value || enviando.value) return

  enviando.value = true
  try {
    await useApiFetch('/api/convite', {
      method: 'POST',
      body: {
        email: alvo.email,
        senha: senha.value,
        nome: alvo.nome,
        perfil: alvo.perfil,
        situacao: alvo.status,
        telefone: alvo.telefone ?? '',
        departamento: alvo.departamento ?? '',
        funcao: alvo.funcao ?? '',
        canal: canal.value
      }
    })
  } catch (erro) {
    const mensagem = (erro as { data?: { statusMessage?: string } }).data?.statusMessage
    toast.danger(
      'Gestão de Usuários',
      mensagem ?? 'Não foi possível enviar o convite. Tente novamente.'
    )
    enviando.value = false
    return
  }
  enviando.value = false

  // A conta real já foi gravada pela API (find-or-create + hash) — nada de
  // espelho em base demo: a linha da lista é o registro do banco.

  if (canal.value === 'email') {
    toast.success('Gestão de Usuários', `Convite enviado para ${alvo.email}.`)
    fechar()
    return
  }

  // WhatsApp: conta já gravada acima — fluxo client inalterado (protocolo +
  // fallback ~2 s, design D4 do modal original).
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
              <UiBadge :variant="variantePerfil(registro.perfil)" size="sm">
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
            description="Envio real pelo sistema de e-mail — nenhum cliente de e-mail é aberto."
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

            <!-- Senha provisória do envio: sempre editável (o servidor guarda só o
                 hash e nunca devolve a senha vigente — RL02 M-04) -->
            <UiInput
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
              :right-icon-label="'Mostrar ou ocultar senha'"
              @right-icon-click="mostrarSenha = !mostrarSenha"
            />
          </div>

          <!-- Gerar senha provisória — abaixo, à direita -->
          <div class="flex justify-end">
            <UiButton variant="outline" size="sm" @click="gerarSenha">
              <template #leftIcon>
                <Sparkles class="h-3.5 w-3.5" />
              </template>
              Gerar senha
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
          sandbox=""
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
      <UiTooltip
        :content="podeEnviar ? '' : 'Informe ou gere a senha provisória (mínimo de 8 caracteres).'"
        position="top"
      >
        <UiButton
          variant="primary"
          size="md"
          :disabled="!podeEnviar"
          :loading="enviando"
          @click="enviar"
        >
          <template #leftIcon><Send class="h-3.5 w-3.5" /></template>
          Enviar Convite
        </UiButton>
      </UiTooltip>
    </template>
  </UiModal>
</template>
